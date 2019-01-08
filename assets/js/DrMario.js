"use strict";
(function (global, ns) {
    /**
     * Encapsulate all functionnality to play the game
     * @param {object} options 
     */
    function DrMario(options) {
        if(options && typeof(options.root) !== "undefined") {
            if(options.root instanceof Promise) {
                options.root.then(this.initUI.bind(this));
            }
            else {
                this.initUI(options.root);
            }
        }

        this._fps = 16;

        this._fps_interval = 1000 / this._fps;
        this._fps_then = 0;

        this.$animate = this._animate.bind(this);
        this._running = false;
        this._tick_counter = 0;
        
        this._tickers = [];
        this._on_game_over_handles = [];
        
        this._soundtrack = null;
        this._control_used = null;

        this.$touchstart = this.touchstart.bind(this);
        this.$touchmove = this.touchmove.bind(this);
        this.$touchend = this.touchend.bind(this);
        this.$notouchscroll = this.notouchscroll.bind(this);
    }

    DrMario.prototype.initUI = function(root) {
        this._root = root;
        this._root.appendChild(
            this._status = document.createElement("div")
        );
        this._root.className = (this._root.className ? this._root.className + " " : "") + "dr-mario";

        this._status.className = "game-status";
        this._status.style.display = "none";
    };

    DrMario.prototype.abort = function() {
        this.releaseTouch();
        this.stop();
        if(this._mainPillBottle) {
            this._mainPillBottle.destroy();
            this._mainPillBottle = null;
        }
    };

    DrMario.prototype.setSoundTrack = function(track) {
        this._soundtrack = track;
    }

    DrMario.prototype.registerForTick = function(handle) {
        this._tickers.push(handle);
        return this;
    };

    DrMario.prototype.deRegisterForTick = function(handle) {
        for(var i=0; i<this._tickers.length; i++) {
            if(this._tickers[i] === handle) {
                this._tickers[i].splice(i,1);
            }
        }

        return this;
    };
    

    DrMario.prototype.startSinglePlayer = function (difficulty) {
        if(this._mainPillBottle) {
            this._mainPillBottle.destroy();
        }
        this._mainPillBottle = new PillBottle({scale:2, root:this._root});
        this._mainPillBottle.generateForDifficulty(difficulty);
        this._mainPillBottle.record();

        this._mainPillBottle._root.className += " main-pill-bottle";

        this._inputs.clearAll();
        this._inputs.register("PAUSE", this.pause.bind(this), null);
        this._inputs.register("ESC", function(){ window.location.reload(); }, null);
        this._mainPillBottle.registerInputs(this._inputs);
    };

    DrMario.prototype.prepareMultiPlayer = function() {
        if(this._mainPillBottle) {
            this._mainPillBottle.destroy();
        }
        this._mainPillBottle = new PillBottle({scale:2, root:this._root});

        this._inputs.clearAll();
        this._inputs.register("PAUSE", this.pause.bind(this), null);
        this._inputs.register("ESC", function(){ window.location.reload(); }, null);
        this._mainPillBottle.registerInputs(this._inputs);
    };

    DrMario.prototype.setForMultiPlayer = function(difficulty) {
        this._mainPillBottle.generateForDifficulty(difficulty);
        this._mainPillBottle.record();
    };

    DrMario.prototype.setGameRules = function(game_rules) {
        this._mainPillBottle.setGameRules(game_rules);
    };

    DrMario.prototype.registerInputs = function(inputs) {
        this._inputs = inputs;
    };

    DrMario.prototype.run = function () {
        this._running = true;
        this._lastVirusCount = null;
        if(this._soundtrack)
            Sounds.play(this._soundtrack);
        else
            Sounds.stopGroup("bg");
    
        this.$animate();
        this.preventScrolling();

        switch(this._control_used = menu.get("my_settings.controls")) {
            case "swipe": this.bindTouch(); break;
            default:
                if(this._control_used.substr(0,3) == 'tap') {
                    this.enableTap();
                }
        }
    };

    DrMario.prototype.stop = function () {
        Sounds.stopGroup("bg");
        this.allowScrolling();
        this._running = false;
        switch(this._control_used) {
            case "swipe": this.releaseTouch(); break;
            default:
                if(this._control_used.substr(0,3) == 'tap') {
                    this.disableTap();
                }
        }
        this._control_used=null;
    };

    DrMario.prototype.pause = function () {
        if(this._running = !this._running) {
            if(this._soundtrack)
                Sounds.resume(this._soundtrack);
            else
                Sounds.stopGroup("bg");
        
            this.$animate();
        }
        else {
            Sounds.stopGroup("bg");
            this._running = false;
        }
    };

    DrMario.prototype.preventScrolling = function() {
        var id = "style-prevent-scrolling";
        var elem = document.getElementById(id);
        if(elem === null) {
            var css = 'html, body { position: fixed; overflow: hidden; }';
            elem = document.createElement("style");
            
            elem.setAttribute("type","text/css");
            elem.setAttribute("id", id);
            if (elem.styleSheet){
                // This is required for IE8 and below.
                elem.styleSheet.cssText = css;
            } else {
                elem.appendChild(document.createTextNode(css));
            }
        }

        if(!elem.parentElement)
            document.getElementsByTagName('head')[0].appendChild(elem);
    };

    DrMario.prototype.allowScrolling = function() {
        var id = "style-prevent-scrolling";
        var elem = document.getElementById(id);
        if(elem && elem.parentElement) {
            elem.parentElement.removeChild(elem);
        }
    };

    DrMario.prototype._animate = function () {
        if (!this._running)
            return;

        window.requestAnimationFrame(this.$animate);

        var now = Date.now();
        var elapsed = now - this._fps_then;

        // if enough time has elapsed, draw the next frame
        if (elapsed > this._fps_interval) {
            this._fps_then = now - (elapsed % this._fps_interval);

            this._tick(++this._tick_counter);
            /* single comment this line to show fps counter
            var doneAt = Date.now();
            var frameTime = doneAt-now;
            window.debug.set("F", round(frameTime)+"/"+round(this._fps_interval));
            //*/
        }
    };

    function round(n) {
        return Math.floor(n*100)/100;
    }

    DrMario.prototype.defeat = function (tick) {
        if(!this.gameOver(false))
            this._mainPillBottle.setMessage("Defeat :(");
    };

    DrMario.prototype.victory = function (tick) {
        if(!this.gameOver(true))
            this._mainPillBottle.setMessage("Victory!");
    };

    DrMario.prototype.gameOver = function(state) {
        this.stop();
        if(this._soundtrack) {
            if(state) {
                if(Sounds.has(this._soundtrack + "-clear"))
                   Sounds.play(this._soundtrack + "-clear");
                else
                    Sounds.play("wii-clear");
            }
            else {
                Sounds.play("wii-clear");
                //Sounds.play("nes-game-lost");
            }
        }

        var preventAlert = false;
        for(var i=0; i<this._on_game_over_handles.length;i++) {
            if(this._on_game_over_handles[i](state) === false) {
                if(this._on_game_over_handles.splice(i,1) === false)
                    preventAlert = true;
            }
        }
        return preventAlert;
    };

    /**
     * Register a callback that will be called when the game is over.
     * first parameter will be the status of the game: true=victory, false=defeat
     * 
     * return false to remove the handler
     */
    DrMario.prototype.onGameOver = function(handle) {
        this._on_game_over_handles.push(handle);
        return this;
    };

    DrMario.prototype.setStatus = function(status) {
        this._status.textContent = status;
        this._status.style.display = status ? "block" : "none" ;
    };

    DrMario.prototype.setStatusHtml = function(html) {
        this._status.innerHTML  = html;
        this._status.style.display = html ? "block" : "none" ;
    };

    DrMario.prototype.touch_sensitivity = 5;
    DrMario.touch_sink_sensitivity_multiplyer = 2;
    DrMario.touch_dead_zone = 3;
    DrMario.touch_tap_time = 250;

    DrMario.prototype.bindTouch = function() {
        document.addEventListener("touchstart", this.$touchstart,{ passive: false });
        document.addEventListener("touchmove", this.$touchmove,{passive: false});
        document.addEventListener("touchend", this.$touchend,{passive: false});
    };
    
    DrMario.prototype.releaseTouch = function() {
        document.removeEventListener("touchstart", this.$touchstart,{ passive: false });
        document.removeEventListener("touchmove", this.$touchmove,{passive: false});
        document.removeEventListener("touchend", this.$touchend,{passive: false});
    };

    DrMario.prototype.enableTap = function(swaps) {
        this.disableTap();
        var swaps = menu.get("keyMap." + menu.get("my_settings.controls") + ".tapSwap");
        this._tapController = new TapController(document.getElementsByTagName("body")[0], this._inputs, swaps);
        this._tapController.display();
    };

    DrMario.prototype.disableTap = function() {
        if(this._tapController) {
            this._tapController.destroy();
            this._tapController = null;
        }
    };

    DrMario.prototype.touchstart = function(ev) {
        this._touches = {};
        //multiplayer._socket.emit("log", "touchstart");
        
        for(var i=0; i<ev.touches.length;i++) {
            this._touches[ev.touches[i].identifier] = {
                x:ev.touches[i].screenX,
                y:ev.touches[i].screenY,
                orgX:ev.touches[i].screenX,
                orgY:ev.touches[i].screenY,
                ts:(new Date()).getTime()
            }; 
        }

        ev.preventDefault();
        ev.stopImmediatePropagation();
    };

    DrMario.prototype.notouchscroll = function(ev) {
        ev.preventDefault();
    };

    DrMario.prototype.touchmove = function(ev) {
        //multiplayer._socket.emit("log", "touchmove");

        ev.preventDefault();

        for(var i=0; i<ev.changedTouches.length;i++) {
            var id = ev.changedTouches[i].identifier;
            if(typeof(this._touches[id]) !== "undefined") {
                // find out how much it changed
                
                var dx=this._touches[id].x-ev.changedTouches[i].screenX;
                var dy=this._touches[id].y-ev.changedTouches[i].screenY;

                if(Math.abs(dx) > this.touch_sensitivity) {
                    this._touches[id].x = ev.changedTouches[i].screenX;
                    if(dx < 0) {
                        this._inputs.press(39);
                        this._inputs.release(39);
                        //this._mainPillBottle._board.action("right");
                    }
                    else {
                        this._inputs.press(37);
                        this._inputs.release(37);
                        //this._mainPillBottle._board.action("left");
                    }
                }

                var abs_dy = Math.abs(dy);
                if(abs_dy > this.touch_sensitivity) {
                    this._touches[id].y = ev.changedTouches[i].screenY;
                    if(dy < 0) {
                        this._inputs.press(40);
                        this._inputs.release(40);
                        //this._mainPillBottle._board.action("down");
                    }
                    else if(abs_dy > DrMario.touch_sink_sensitivity_multiplyer*this.touch_sensitivity) {
                        this._inputs.press(38);
                        this._inputs.release(38);
                        //this._mainPillBottle._board.action("sink");
                    }
                }
            }
        }

        ev.preventDefault();
        ev.stopImmediatePropagation();
    };

    DrMario.prototype.touchend = function(ev) {
        //multiplayer._socket.emit("log", "touchend");
        
        for(var i=0; i<ev.changedTouches.length;i++) {
            var id = ev.changedTouches[i].identifier;
            if(typeof(this._touches[id]) !== "undefined") {
                // find out how much it changed
                
                var dx=this._touches[id].orgX-ev.changedTouches[i].screenX;
                var dy=this._touches[id].orgY-ev.changedTouches[i].screenY;
                var dt=(new Date()).getTime() - this._touches[id].ts;

                //multiplayer._socket.emit("log", ["dx",dx,"dy",dy,"dt",dt].join(" "));

                if(Math.abs(dx) < DrMario.touch_dead_zone && Math.abs(dy) < DrMario.touch_dead_zone && dt < DrMario.touch_tap_time) {
                    this._inputs.press(88);
                    this._inputs.release(88);
                }
            }
        }

        // clear touches
        this._touches = {}
        ev.preventDefault();
        ev.stopImmediatePropagation();
    };

    DrMario.prototype._tick = function (tick) {
        //window.debug.set("Tick",tick);

        for(var i = 0; i<this._tickers.length; i++)
            this._tickers[i](tick);

        
        this._game_stats = this._mainPillBottle.tick(tick);

        // render
        this._mainPillBottle.render(tick);

        if(this._game_stats.gameOver) {
            this.defeat();
        }
        else {
            if(this._game_stats.virus == 3 && this._lastVirusCount != 3) {
                Sounds.play("almost_done");
            }

            this._lastVirusCount = this._game_stats.virus;
            if(this._game_stats.virus == 0 && this._game_stats.explosions == 0) {
                // render 1 last time to play the destroying animation
                this.victory();
            }
        }
    };

    global[ns] = DrMario;
})(this, "DrMario");