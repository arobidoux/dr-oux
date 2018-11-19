"use strict";
(function (global, ns) {
    /**
     * Encapsulate all functionnality to play the game
     * @param {object} options 
     */
    function DrMario(options) {
        this._root = options && options.root || null;
        if (!this._root) {
            document.getElementsByTagName("body")[0]
                .append(this._root = document.createElement("div"));
        }

        this._root.append(
            this._status = document.createElement("div")
        );
        this._status.className = "game-status";

        this._fps = 16;

        this._fps_interval = 1000 / this._fps;
        this._fps_then = 0;

        this._root.className = (this._root.className ? this._root.className + " " : "") + "dr-mario";

        this.$animate = this._animate.bind(this);
        this._running = false;
        this._tick_counter = 0;
        
        this._tickers = [];
        
        this._status.innerText = "Welcome";
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

        this._inputs.clearAll();
        this._inputs.register("PAUSE", this.pause.bind(this), null);
        this._mainPillBottle.registerInputs(this._inputs);
    };

    DrMario.prototype.prepareMultiPlayer = function() {
        if(this._mainPillBottle) {
            this._mainPillBottle.destroy();
        }
        this._mainPillBottle = new PillBottle({scale:2, root:this._root});

        this._inputs.clearAll();
        this._inputs.register("PAUSE", this.pause.bind(this), null);
        this._mainPillBottle.registerInputs(this._inputs);
    };

    DrMario.prototype.setForMultiPlayer = function(difficulty) {
        this._mainPillBottle.generateForDifficulty(difficulty);
        this._mainPillBottle.record();
    };

    DrMario.prototype.registerInputs = function(inputs) {
        this._inputs = inputs;
    };

    DrMario.prototype.run = function () {
        this._running = true;
        this.$animate();
    };

    DrMario.prototype.stop = function () {
        this._running = false;
    };

    DrMario.prototype.pause = function () {
        this[ this._running ? "stop" : "run" ]();
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
        }
    };

    DrMario.prototype.defeat = function (tick) {
        this.stop();
        setTimeout(function(){
            alert("Defeat :(");
        });
    };

    DrMario.prototype.victory = function (tick) {
        this.stop();
        setTimeout(function(){
            alert("Victory!");
        });
    };

    DrMario.prototype._tick = function (tick) {
        //window.debug.set("Tick",tick);
        var prevStats = this._game_stats;

        for(var i = 0; i<this._tickers.length; i++)
            this._tickers[i](tick);

        
        this._game_stats = this._mainPillBottle.tick(tick);

        // render
        this._mainPillBottle.render(tick);

        if(this._game_stats.gameOver) {
            this.defeat();
        }
        else {
            if (!prevStats || prevStats.virus != this._game_stats.virus)
                this._status.innerText =
                    "Virus" + (this._game_stats.virus>1?"es":"") +
                    " Remaining: " + this._game_stats.virus;
            
            if(this._game_stats.virus == 0 && this._game_stats.explosions == 0) {
                // render 1 last time to play the destroying animation
                this.victory();
            }
        }
    };

    global[ns] = DrMario;
})(this, "DrMario")