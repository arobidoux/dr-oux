(function (global, ns){
    "use strict";

    /**
     * Starts a new Timer, starting to count as soon as created
     */
    function Timer() {
        this._start = Timer.now();
        this._end = null;
    }

    /**
     * Terminate the timer
     */
    Timer.prototype.stop = function() {
        if(this._end !== null) {
            console.warn("Timer stopped multiple time");
        }

        this._end = Timer.now();
    };

    /**
     * Return the time elapsed between the begining and the end
     */
    Timer.prototype.elapsed = function() {
        return this._end ? this._end - this._start : null;
    };


    Timer.prototype.laps = function() {

    };

    /**
     * Helper to retrieve the current timestamp (in ms)
     */
    Timer.now = function() {
        return (new Date()).getTime();
    };

    global[ns] = Timer;
})(this, "Timer");