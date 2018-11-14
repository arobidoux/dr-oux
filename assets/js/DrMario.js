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
        this._fps = 16;

        this._fps_interval = 1000 / this._fps;
        this._fps_then = 0;

        this._root.className = (this._root.className ? this._root.className + " " : "") + "dr-mario";

        this._mainPillBottle = new PillBottle(this,2);
        this.$animate = this._animate.bind(this);
        this._running = false;
        this._tick_counter = 0;

        this._tickers = [];
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
        this._mainPillBottle.generateForDifficulty(difficulty);
    };

    DrMario.prototype.registerInputs = function(inputs) {
        inputs.register("PAUSE", this.pause.bind(this), null);
        
        this._mainPillBottle.registerInputs(inputs);
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

            // Put your drawing code here
            this._tick(++this._tick_counter);
        }
    };

    DrMario.prototype._tick = function (tick) {
        for(var i = 0; i<this._tickers.length; i++)
            this._tickers[i](tick);

        this._mainPillBottle.tick(tick);

        // render
        this._mainPillBottle.render(tick);
    };

    global[ns] = DrMario;
})(this, "DrMario")