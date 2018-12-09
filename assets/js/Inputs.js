(function (global, ns) {

    function Inputs() {
        this._actions = {};
        this._mapping = {};
    }

    Inputs.prototype.loadKeyMap = function(mapping) {
        for(var keyCode in mapping) {
            this._mapping[keyCode] = {
                action: mapping[keyCode],
                state: false,
                released: false,
                elapsed: 0
            };
        }

        return this;
    };

    Inputs.prototype.bindKeys = function () {
        document.addEventListener("keydown", function (ev) {
            this.press(ev.which);
        }.bind(this));

        document.addEventListener("keyup", function (ev) {
            this.release(ev.which);
        }.bind(this));

        return this;
    };

    Inputs.prototype.clearAll = function() {
        this._actions = {};
    };

    Inputs.prototype.register = function (actionName, handle, tick_repeat) {
        if (typeof (this._actions[actionName]) !== "undefined") {
            console.error("Input action conflict '" + actionName + "'");
            return false;
        }

        this._actions[actionName] = {
            handle: handle,
            repeat: 0,
            tickless: false
        };

        switch (typeof (tick_repeat)) {
            case "undefined": this._actions[actionName].repeat = 0; break;
            case "bool": this._actions[actionName].repeat = tick_repeat ? 1 : 0; break;
            case "number": case "string": this._actions[actionName].repeat = tick_repeat; break;
            default:
                if(tick_repeat === null) {
                    this._actions[actionName].tickless = true;
                }
                else {
                    console.error("Unhandled repeat value for action '" + actionName + "': " + JSON.stringify(tick_repeat));
                }
        }
        return this;
    };

    Inputs.prototype.press = function (keyCode) {
        if (typeof (this._mapping[keyCode]) === "undefined") {
            // console.warn("[Inputs] No mapping for " + keyCode);
        }
        else if (typeof (this._actions[this._mapping[keyCode].action]) === "undefined") {
            console.warn("[Inputs] No action mapped on " + this._mapping[keyCode].action + " (keyCode:" + keyCode + ")");
        }
        else if(!this._mapping[keyCode].state) {
            this._mapping[keyCode].released = false;
            this._mapping[keyCode].elapsed = 0;

            var action = this._actions[this._mapping[keyCode].action];
            if(action.tickless) {
                //console.debug("Running tickless action " + this._mapping[keyCode].action);
                action.handle();
            }
            else {
                //console.debug("Pressing key " + keyCode);
                this._mapping[keyCode].state = true;
            }
        }
    };

    Inputs.prototype.release = function (keyCode) {
        if(typeof(this._mapping[keyCode]) !== "undefined") {
            this._mapping[keyCode].released = true;
        }
    };

    Inputs.prototype.tick = function (tick) {
        for (var keyCode in this._mapping) {
            if (this._mapping[keyCode].state) {
                var action = this._actions[this._mapping[keyCode].action];
                if(
                    this._mapping[keyCode].elapsed == 0 ||
                    (action.repeat && this._mapping[keyCode].elapsed % action.repeat == 0)
                ) {
                    //console.debug("Running ticked action " + this._mapping[keyCode].action);
                    action.handle(tick);
                }

                this._mapping[keyCode].elapsed++;

                if(this._mapping[keyCode].released) {
                    //console.debug("Releasing key " + keyCode);
                    this._mapping[keyCode].state = false;
                }
            } 
        }
    };

    global[ns] = Inputs;
})(this, "Inputs");
