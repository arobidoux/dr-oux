!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var n;n="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,n.uuidv1=e()}}(function(){return function e(n,r,o){function t(u,f){if(!r[u]){if(!n[u]){var s="function"==typeof require&&require;if(!f&&s)return s(u,!0);if(i)return i(u,!0);var d=new Error("Cannot find module '"+u+"'");throw d.code="MODULE_NOT_FOUND",d}var a=r[u]={exports:{}};n[u][0].call(a.exports,function(e){var r=n[u][1][e];return t(r?r:e)},a,a.exports,e,n,r,o)}return r[u].exports}for(var i="function"==typeof require&&require,u=0;u<o.length;u++)t(o[u]);return t}({1:[function(e,n,r){function o(e,n){var r=n||0,o=t;return[o[e[r++]],o[e[r++]],o[e[r++]],o[e[r++]],"-",o[e[r++]],o[e[r++]],"-",o[e[r++]],o[e[r++]],"-",o[e[r++]],o[e[r++]],"-",o[e[r++]],o[e[r++]],o[e[r++]],o[e[r++]],o[e[r++]],o[e[r++]]].join("")}for(var t=[],i=0;i<256;++i)t[i]=(i+256).toString(16).substr(1);n.exports=o},{}],2:[function(e,n,r){var o="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof window.msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto);if(o){var t=new Uint8Array(16);n.exports=function(){return o(t),t}}else{var i=new Array(16);n.exports=function(){for(var e,n=0;n<16;n++)0===(3&n)&&(e=4294967296*Math.random()),i[n]=e>>>((3&n)<<3)&255;return i}}},{}],3:[function(e,n,r){function o(e,n,r){var o=n&&r||0,a=n||[];e=e||{};var c=e.node||t,l=void 0!==e.clockseq?e.clockseq:i;if(null==c||null==l){var p=u();null==c&&(c=t=[1|p[0],p[1],p[2],p[3],p[4],p[5]]),null==l&&(l=i=16383&(p[6]<<8|p[7]))}var v=void 0!==e.msecs?e.msecs:(new Date).getTime(),y=void 0!==e.nsecs?e.nsecs:d+1,m=v-s+(y-d)/1e4;if(m<0&&void 0===e.clockseq&&(l=l+1&16383),(m<0||v>s)&&void 0===e.nsecs&&(y=0),y>=1e4)throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");s=v,d=y,i=l,v+=122192928e5;var w=(1e4*(268435455&v)+y)%4294967296;a[o++]=w>>>24&255,a[o++]=w>>>16&255,a[o++]=w>>>8&255,a[o++]=255&w;var b=v/4294967296*1e4&268435455;a[o++]=b>>>8&255,a[o++]=255&b,a[o++]=b>>>24&15|16,a[o++]=b>>>16&255,a[o++]=l>>>8|128,a[o++]=255&l;for(var g=0;g<6;++g)a[o+g]=c[g];return n?n:f(a)}var t,i,u=e("./lib/rng"),f=e("./lib/bytesToUuid"),s=0,d=0;n.exports=o},{"./lib/bytesToUuid":1,"./lib/rng":2}]},{},[3])(3)});
(function(global, ns){
    function Debug(root) {
        root.appendChild(this._element = document.createElement("pre"));

        this._values = {};
    }

    Debug.prototype.set = function(key, value) {
        this._values[key] = value;
        return this;
    };

    Debug.prototype.tick = function() {
        var s = this._serialize();
        if(s != this._element.innerText)
            this._element.innerText = s;
    };

    Debug.prototype._serialize = function() {
        var s = "";
        var line = ".".repeat(16);

        for(var k in this._values)
            s += (k+line).substr(0,16) + ":" + this._values[k] + "\n";
        
        return s;
    };

    global[ns] = Debug;
})(this,"Debug");
(function (global, ns){
    "use strict";
    
    var body = document.getElementsByTagName("body")[0];
    var next_callback_id = 1;
    var callback_salt = "__jsonp_generated_callback_";

    function jsonp(url, timeout, replacestr) {
        return new Promise(function(resolve, reject) {
            // generate context
            var ctx = {
                script: document.createElement("script"),
                callbackname: callback_salt + (next_callback_id++),
                timeoutId: null,
                reject: reject,
                resolve: resolve
            };
            
            // schedule error timeout (if defined)
            if(typeof(timeout) !== "undefined")
                ctx.timeoutId = setTimeout(failure.bind(ctx), timeout*1000);

            // register success callback
            window[ctx.callbackname] = success.bind(ctx);
            
            // add registered callback name to the url
            if(typeof(replacestr) !== "undefined")
                url.replace(replacestr, ctx.callbackname);
            else
                url += ctx.callbackname;

            // append to body
            body.appendChild(ctx.script);

            // load the url
            ctx.script.src = url;
        });
    }

    // success callback, this should be the `ctx` defined from jsonp
    function success(data) {
        if(this.timeoutId)
            clearTimeout(this.timeoutId);

        if(this.script.parentElement)
            this.script.parentElement.removeChild(this.script);
        this.resolve(data);
    }

    // failure callback, this should be the `ctx` defined from jsonp
    function failure() {
        if(this.script.parentElement)
            this.script.parentElement.removeChild(this.script);

        this.timeoutId = null;
        this.reject();
    }

    global[ns] = jsonp;
})(this, "jsonp");
(function (global, ns){
    "use strict";
    function preference(key, defaultValue) {
        try {
            var v = localStorage.getItem(key);
            return v === null ? defaultValue : v;
        }
        catch(e) {
            return defaultValue;
        }
    }

    preference.set = function(name, value) {
        try {
            localStorage.setItem(name, value);
        } catch(e) {}
    };

    global[ns] = preference;
})(this, "preference");
(function (global, ns){
    "use strict";

    var muted = false;
    var volume = 1;
    var elements = null;
    var library = {
        "sfx": {
            "combo1": { start: 0, end: 1 },
            "combo2": { start: 2, end: 2.5 },
            "nes-combo-1": { start: 4, end: 5 },
            "nes-combo-2": { start: 6, end: 8 },
            "pause": { start:8, end:8.5 },
            "destroy": {
                "tracks": [
                    {odd:.5,start:9,end:9.53},
                    {odd:.5,start:10,end:10.51}
                ]
            },
            "destroy-combo": { start:11.1, end:11.71 },
            "almost_done" : { start:15, end:16.7 },
            "warning" : { start: 16.9, end: 18.4 },
            "dududididu": { start:3, end: 3.8 },
        },
        "sfx-m": {
            "fall": { start: 12, end: 12.16 },
            "move": { start: 13, end: 13.15 },
            "rotate": { start:14, end:14.25 },
        },
        "bg-nes": {
            "nes-title":{ start: 0, end: 126 },
            "nes-select":{ start: 129, end: 177 },
            "nes-fever":{ start: 180, end: 322 },
            "nes-fever-clear":{ start: 325, end: 348, },
            "nes-chill":{ start: 352, end: 594 },
            "nes-chill-clear":{ start: 597, end: 619 },
            "nes-vs-game-over":{ start: 646, end: 761 },
            "nes-game-lost":{ start: 622, end: 645 }
        },
        "bg-wii": {
            "wii-title":{ start: 0, end: 108 },
            "wii-select":{ start: 109.90, end: 129.55 },
            "wii-fever":{ intro:130.35, start: 134.8, end: 201 },
            "wii-chill":{ start: 202.3, end: 326.33 },
            "wii-cough":{ start: 343.85, end: 445.4 },
            "wii-sneeze":{ start: 462.1, end: 569 },
            "wii-clear": { intro: 587.75, start: 590.2, end: 649.5 }
        }
    };

    Sounds.library = library;

    function Sounds(key) {
        Sounds.play(key);
    }

    Sounds.initialize = function() {
        if(elements !== null)
            return;
        
        elements = {};

        for(var group in library) {
            var elems = [];
            var elem = document.getElementById("audio-" + group);
            if(elem)
                elems.push(elem);
            for(var i=1;i<10;i++) {
                elem = document.getElementById("audio-" + group + "-" + i );
                if(elem)
                    elems.push(elem);
            }
            if(elems.length>0)
                elements[group] = new AudioElement(elems);
        }
    };

    Sounds.initialized = function() {
        return elements !== null;
    };

    Sounds.mute = function() {
        Sounds.stopAll();
        muted = true;
    };

    Sounds.unmute = function() {
        muted = false;
    };

    Sounds.setVolume = function(v) {
        volume = v < 1 ? v : (v>100 ? 1 : v/100);
        for(var g in elements)
            elements[g].setVolume(volume);
    };

    function getGroupFor(key) {
        for(var group in library)
            if(typeof(library[group][key]) !== "undefined")
                return group;

        return null;
    }

    function getTrackInfo(key) {
        var group = getGroupFor(key);
        if(group === null)
            return null;

        var track = null;
        if( typeof(library[group][key].tracks) !== "undefined" ) {
            var rnd = Math.random();
            for(var i=0;i<library[group][key].tracks.length; i++) {
                if(rnd < library[group][key].tracks[i].odd) {
                    track = library[group][key].tracks[i];
                    break;
                }
                else {
                    rnd -= library[group][key].tracks[i].odd;
                }
            }
        }
        else {
            track = library[group][key];
        }

        return {
            group: group,
            intro: typeof(track.intro) === "undefined" ? track.start : track.intro,
            start: track.start,
            end: track.end,
        };
    }

    Sounds.has = function(key) {
        return getGroupFor(key) !== null;
    };

    Sounds.warmup = function(key) {
        var track = getTrackInfo(key);
        if(track !== null) {
            elements[track.group].warmup(track.intro, track.end);
        }
    };

    Sounds.play = function(key) {
        if(muted || elements === null)
            return;

        var track = getTrackInfo(key);
        if(track !== null && typeof(elements[track.group]) !== "undefined") {
            elements[track.group].playSprite(track.intro, track.end, track.group.substr(0,2) == "bg", track.start);
        }
    };

    Sounds.resume = function(key) {
        if(muted || elements === null)
            return;

        var group = getGroupFor(key);
        if(elements === null || typeof(elements[group]) === "undefined")
            return;

        elements[group].resume();
    };

    Sounds.stop = function(key) {
        var group = getGroupFor(key);
        if(elements === null || typeof(elements[group]) === "undefined")
            return;

        elements[group].pause();
    };

    Sounds.stopAll = function() {
        if(elements) {
            for(var g in elements) {
                elements[g].pause();
            }
        }
    };

    Sounds.stopGroup = function(group) {
        if(elements) {
            for(var g in elements) {
                if(g.indexOf(group) === 0) {
                    elements[g].pause();
                }
            }
        }
    };

    function AudioElement(elems){
        this._elems = elems;
        this._next_id = 0;
        this._contexts = [];

        for(var i=0;i<this._elems.length;i++) {
            var ctx = {
                restartAt: null,
                stopAt: null,
                loop: false,
                _warmingUp: false
            };
            
            this._elems[i].addEventListener("timeupdate", this._timeupdate.bind(this, i));
            this._contexts.push(ctx);
            this._elems[i].volume = volume;
        }
    }

    AudioElement.prototype._get_next_idx = function() {
        return this._elems.length === 1 ? 0 : this._next_id++ % this._elems.length;
    };

    AudioElement.prototype._timeupdate = function(i, ev) {
        if(this._contexts[i].warmingUp === true) {
            this._contexts[i].warmingUp = false;
            this._elems[i].pause();
        }

        if(this._contexts[i].stopAt !== null && this._contexts[i].stopAt <= this._elems[i].currentTime) {
            if(this._contexts[i].loop && this._contexts[i].restartAt !== null) {
                this._elems[i].currentTime = this._contexts[i].restartAt;
            }
            else {
                this._elems[i].pause();
                this._contexts[i].stopAt = null;
            }
        }
    };

    AudioElement.prototype.setVolume = function(v) {
        for(var i=0; i<this._elems.length;i++)
            this._elems[i].volume = v;
    };

    AudioElement.prototype.playSprite = function(start, end, loop, restartAt) {
        var i = this._get_next_idx();
        this._elems[i].currentTime = start;
        this._contexts[i].restartAt = restartAt;
        this._contexts[i].stopAt = end;
        this._contexts[i].loop = typeof(loop) === "undefined" ? false : loop;
        this.resume(i);
    };

    AudioElement.prototype.warmup = function(start, end) {
        for(var i=0;i<this._elems.length;i++) {
            this._contexts[i].warmingUp = true;
            
            this._elems[i].currentTime = start;
            this._contexts[i].stopAt = end;
            this._contexts[i].restartAt = null;
            this._contexts[i].loop = false;
            
            this.resume(i);
        }
    };

    AudioElement.prototype.pause = function() {
        for(var i=0;i<this._elems.length; i++)
            this._elems[i].pause();
    };

    AudioElement.prototype.resume = function(i) {
        if(typeof(i)==="undefined")
            i=0;
        try {
            this._elems[i].play().catch(function(err) {
                if(menu)
                    menu.init.then(function(){
                        menu.set("require_click_to_play", true);
                    });
            });
        } catch(e) {
            // shhh
        }
    };

    global[ns] = Sounds;
})(this, "Sounds");
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

(function(global, ns){
    function TapController(parentElement, inputs) {
        var root = this._root = document.createElement("div");
        root.className = "tap-controller";
        root.addEventListener("touchstart", this._touchStart.bind(this));
        root.addEventListener("touchend", this._touchEnd.bind(this));

        this._zones = TapController.defaultZones();
        this._touches = {};
        this._inputs = inputs;

        document.getElementById("main").style.bottom = (Math.floor(window.innerHeight*.25)-20)+"px";

        parentElement.appendChild(root);
    }

    TapController.prototype.display = function() {
        for(var i=0;i<this._zones.length;i++) {
            var elem = document.createElement("div");
            elem.className = "zone";
            elem.style.left = this._zones[i].zone[0] + "px";
            elem.style.top = this._zones[i].zone[1] + "px";
            elem.style.width = elem.style.lineHeight = (this._zones[i].zone[2] - this._zones[i].zone[0] -1) + "px";
            elem.style.height = elem.style.lineHeight = (this._zones[i].zone[3] - this._zones[i].zone[1] -1) + "px";
            elem.style.textAlign = "center";
            elem.textContent = this._zones[i].label;

            this._root.appendChild(elem);
        }
        this._root.addEventListener("mousedown", function(e){ e.preventDefault(); }, false);
        this._root.className += " shown";
    };

    TapController.prototype.destroy = function() {
        if(this._root) {
            if(this._root.parentElement)
                this._root.parentElement.removeChild(this._root);
            this._root = null;

            document.getElementById("main").style.removeProperty("bottom");
        }
    };

    TapController.prototype._touchStart = function(ev) {        
        if(!this._inputs)
            return;

        for(var i=0; i<ev.changedTouches.length;i++) {
            if(typeof(this._touches[ev.changedTouches[i].identifier]) === "undefined") {
                for(var j=0;j<this._zones.length; j++ ) {
                    if(
                        ev.changedTouches[i].clientX >= this._zones[j].zone[0] &&
                        ev.changedTouches[i].clientX < this._zones[j].zone[2] &&
                        ev.changedTouches[i].clientY >= this._zones[j].zone[1] &&
                        ev.changedTouches[i].clientY < this._zones[j].zone[3]
                    ) {
                        this._touches[ev.changedTouches[i].identifier] = this._zones[j].keyCode;
                        //console.log("[TAP] pressing "+this._zones[j].keyCode);
                        this._inputs.press(this._zones[j].keyCode);
                        break;
                    }
                }
            }
        }
    };

    TapController.prototype._touchEnd = function(ev) {
        if(!this._inputs)
            return;

        for(var i=0; i<ev.changedTouches.length;i++) {
            if(typeof(this._touches[ev.changedTouches[i].identifier]) !== "undefined") {
                this._inputs.release(this._touches[ev.changedTouches[i].identifier]);
                //console.log("[TAP] releasing "+this._touches[ev.changedTouches[i].identifier]);
                delete this._touches[ev.changedTouches[i].identifier];
            }
        }
    };

    TapController.defaultZones = function() {
        /*
        ---------------------------
        |          ESC            |
        ---------------------------
        |         PAUSE           |
        |-------------------------|
        |      |    A     |       |
        | LEFT |----------| RIGHT |
        |      |    B     |       |
        |-------------------------|
        |    DOWN   |     SINK    |
        ---------------------------
        */
        
       var h = window.innerHeight;
       var w = window.innerWidth;

       var h05 = Math.floor(h * .05);
       var h25 = Math.floor(h * .25);
       var h50 = Math.floor(h * .5);
       var h75 = Math.floor(h * .75);
       var w25 = Math.floor(w * .25);
       var w50 = Math.floor(w * .5);
       var w75 = Math.floor(w * .75);

       return [
           {keyCode:40, label:"DOWN",  zone:[  0, h75, w50,   h]},
           {keyCode:38, label:"SINK",  zone:[w50, h75,   w,   h]},
           {keyCode:37, label:"LEFT",  zone:[  0, h25, w25, h75]},
           {keyCode:39, label:"RIGHT", zone:[w75, h25,   w, h75]},
           {keyCode:88, label:"A",     zone:[w25, h25, w75, h50]},
           {keyCode:90, label:"B",     zone:[w25, h50, w75, h75]},
           {keyCode:19, label:"PAUSE", zone:[  0, h05,   w, h25]},
           {keyCode:27, label:"ESC",   zone:[  0,   0,   w, h05]}
       ];
    };
        
    global[ns] = TapController;
})(this,"TapController");

(function (global, ns) {

    /**
     * Represent a pill that is in motion on the board
     * 
     * @param {Board}       board reference to the board this pill will be added to
     * @param {number}      speed at which the pill will be affected by gravity
     * @param {Board.CODES} a code for the first half of the pill
     * @param {Board.CODES} b code for the 2nd half of the pill, if any
     * @param {number}     x position of the a piece
     * @param {number}   y position of the a piece
     */
    function Pill(board, speed, a, b, x, y) {
        this.board = board;
        this.speed = speed;
        this.a = a;
        this.b = b;
        this.x = x;
        this.y = y;

        this._almost = false;
        // TODO make sure the pill starts at the top row (Maybe even one before)
        // TODO check to do the animation of the pill being thrown at the begening of the game
        //      might take care of TODO above

        if(typeof(x) !== "undefined")
            this._move({});
    }

    /** Move the pill without validating destination. Update board */
    Pill.prototype._move = function (update) {
        this.board.fill(this.x, this.y);

        if (this.b) {
            var bPos = this.getBPos()
            this.board.fill(bPos.x, bPos.y);
        }

        for (var k in update)
            this[k] = update[k];

        this.board.fill(this.x, this.y, this.a);
        if (this.b) {
            var bPos = this.getBPos()
            this.board.fill(bPos.x, bPos.y, this.b);
        }
    };

    /** Move the pill left, if possible */
    Pill.prototype.left = function () {
        var dx = -1;
        if (this.canTranslate(dx, 0)) {
            this._move({ x: this.x + dx });
            Sounds.play("move");
            return true;
        }
        return false;
    };

    /** Move the pill right, if possible */
    Pill.prototype.right = function () {
        var dx = 1;
        if (this.canTranslate(dx, 0)) {
            this._move({ x: this.x + dx });
            Sounds.play("move");
            return true;
        }
        return false;
    };

    /** Move the pill Vertically (down only), if possible */
    Pill.prototype.down = function () {
        var dy = 1;
        if (this.canTranslate(0, dy)) {
            this._move({ y: this.y + dy });
            return true;
        }
        return false;
    };

    /** Move the pill as low as it will go */
    Pill.prototype.sink = function () {
        for( var dy = 1; this.canTranslate(0, dy) ; dy++);
        Sounds.play("fall");
        this._move({
            a: (this.a & (0xff^Board.CODES.states.mask)) | Board.CODES.states.values.dead.code,
            b: (this.b & (0xff^Board.CODES.states.mask)) | Board.CODES.states.values.dead.code,
            y:this.y+dy-1
        });
    };

    /** Rotate the pill Clockwise */
    Pill.prototype.rotate = function (counterClockwise) {
        var move = {
            a:Board.rotate(this.a, counterClockwise),
            b:Board.rotate(this.b, counterClockwise)
        };

        var bForm = move.b & Board.CODES.forms.mask;

        if(bForm == Board.CODES.forms.values.up.code || bForm == Board.CODES.forms.values.right.code) {
            // switch a & b
            var t = move.a;
            move.a = move.b;
            move.b = t;
        }

        var temp = this.getPosFromCode(move.b);
        if(!this.board.isEmptySpace(temp.x, temp.y)) {
            // if facing up, look of we can shift it left
            var aForm = this.a & Board.CODES.forms.mask;
            if(
                (aForm == Board.CODES.forms.values.up.code) &&
                this.board.isEmptySpace(this.x-1, this.y)
            ) {
                move.x = this.x-1; 
            }
            // if facing right and on the top row
            else if(this.y == 0 && aForm == Board.CODES.forms.values.right.code) {
                // allow it
            }
            else {   
                return false;
            }
        }

        Sounds.play("rotate");

        // Only "a" will be "down" or "right"
        this._move(move); 
    };

    /** Rotate the pill Counter-Clockwise */
    Pill.prototype.rotateC = function () {
        return this.rotate(true);
    };

    Pill.prototype.canTranslate = function (dx, dy) {
        var temptative_x = this.x + dx;
        var temptative_y = this.y + dy;
        var temptative_checked = false;
        // validate for b
        if (this.b) {
            var bPos = this.getBPos();

            // if b is where a is going, do not run that check
            if (temptative_x == bPos.x && temptative_y == bPos.y)
                temptative_checked = true;

            bPos.x += dx;
            bPos.y += dy;
            if (this.x == bPos.x && this.y == bPos.y) {
                // a is where b is going to be, no need to validate
            }
            else if (bPos.y >= 0 && !this.board.isEmptySpace(bPos.x, bPos.y))
                return false;
        }

        // validate target position of a (if is not where b currently is)
        if (!temptative_checked && !this.board.isEmptySpace(temptative_x, temptative_y))
            return false;

        // all check are green!
        return true;
    };

    Pill.prototype.getBPos = function () {
        return this.getPosFromCode(this.b);
    };

    Pill.prototype.getPosFromCode = function (code) {
        switch (code & Board.CODES.forms.mask) {
            case Board.CODES.forms.values.right.code: return { x: this.x - 1, y: this.y };
            case Board.CODES.forms.values.left.code: return { x: this.x + 1, y: this.y };
            case Board.CODES.forms.values.up.code: return { x: this.x, y: this.y + 1 };
            case Board.CODES.forms.values.down.code: return { x: this.x, y: this.y - 1 };
        }
        return null;
    };

    Pill.TICK = {
        STUCK: 0,
        ALMOST:1,
        MOVED: 2,
        SLEEP: 3
    };

    Pill.prototype.tick = function (tick) {
        if (tick % this.speed == 0) {
            if (!this.canTranslate(0, 1)) {
                // look for grace period
                if(!this._almost) {
                    this._almost = true;
                    return Pill.TICK.ALMOST;
                }
                else {
                    Sounds.play("fall");
                    return Pill.TICK.STUCK;
                }
            }

            this._almost = false;
            this._move({ y: this.y + 1 });
            return Pill.TICK.MOVED;
        }
        return Pill.TICK.SLEEP;
    };

    global[ns] = Pill;

})(this, "Pill");
(function (global, ns) {
    const SPEED_FACTOR = 16;
    const ANIMATION_TICK_MULTIPLIER = .25;
    const SUITE_MIN_LENGTH = 3;
    const BOARD_TICK_SPEED = 1 / ANIMATION_TICK_MULTIPLIER;
    /**
     * Represent a play board in memory
     * Handle piece movement, sprite rendering, etc
     * 
     * @param {int} width  how many square wide is the bottle
     * @param {int} height how many square high is the bottle
     */
    function Board(options) {
        this._width = options && options.width || 8;
        this._height = options && options.height || 16;
        this._speed = options && options.speed || Board.SPEED.NORMAL;

        this._effective_speed = (1 / this._speed) * SPEED_FACTOR;
        this._size = this._height * this._width;
        this._previousFrame = null;
        this._film = [];
        this._filmWeight = 0;

        /** Full representation of the board on 1 string
         * Rows are represented from top to bottom, left to right
         * horizontal value are consecutive, vertical values are
         * offseted by this._width
         */
        if (typeof (Uint8Array) !== "undefined")
            this._data = new Uint8Array(this._size);
        else
            this._data = new Array(this._size);

        // fill in with zeros
        if(typeof(this._data.fill)!=="function") {
            for(var i=0;i<this._data.length;i++)
                this._data[i] = 0x00;
        }
        else {
            this._data.fill(0x00);
        }

        this._ownedPill = null;
        this._nextPill = null;
        this._generateNextOwnPillOn = 0;
        this._handicaps = [];
        this._warned = false;
        this._stats = {
            virus: 0,
            explosions: 0,
            counting_combos: [],
            combos: [],
            gameOver: false
        };
    }

    Board.SPEED = {
        SLOW: 1,
        NORMAL: 2,
        FAST: 4,
    };

    Board.prototype.registerInputs = function (input) {
        this.queueNextPill();

        inputs.register("RIGHT", this.action.bind(this, "right"), 1 / ANIMATION_TICK_MULTIPLIER);
        inputs.register("LEFT", this.action.bind(this, "left"), 1 / ANIMATION_TICK_MULTIPLIER);
        inputs.register("DOWN", this.action.bind(this, "down"), 1 / (2 * ANIMATION_TICK_MULTIPLIER));
        inputs.register("UP", this.action.bind(this, "sink"), 1 / ANIMATION_TICK_MULTIPLIER);
        inputs.register("ROTATE_CLOCKWISE", this.action.bind(this, "rotate"));
        inputs.register("ROTATE_COUNTER_CLOCKWISE", this.action.bind(this, "rotateC"));
    };

    Board.prototype.destroyCell = function (x, y) {
        var p = this.coordToPos(x, y);
        var f = this._data[p] & Board.CODES.forms.mask;

        // update double pill
        var delta = 0;
        switch (f) {
            case Board.CODES.forms.values.up.code: delta = -1 * this._width; break;
            case Board.CODES.forms.values.down.code: delta = this._width; break;
            case Board.CODES.forms.values.left.code: delta = -1; break;
            case Board.CODES.forms.values.right.code: delta = 1; break;
        }
        if (delta) {
            var p2 = p + delta;
            if (p2 > 0 && p2 < this._size) {
                this._data[p2] = this._data[p2] & Board.CODES.colors.mask;
            }
        }

        this._data[p] = Board.CODES.forms.values.exploding.code | (this._data[p] & Board.CODES.colors.mask);
    }

    Board.prototype._checkPillDestruction = function (x, y) {
        var l = this.getColorLength(x, y);

        var destroyed = 0;

        if (l.u + l.d >= SUITE_MIN_LENGTH) {
            for (var i = 0; i <= l.u; i++)
                this.destroyCell(x, y - i);
            for (var i = 1; i <= l.d; i++)
                this.destroyCell(x, y + i);
            destroyed++;
        }

        if (l.l + l.r >= SUITE_MIN_LENGTH) {
            for (var i = 0; i <= l.l; i++)
                this.destroyCell(x - i, y);
            for (var i = 1; i <= l.r; i++)
                this.destroyCell(x + i, y);
            destroyed++;
        }
        return destroyed;
    };

    Board.prototype.tickBoard = function (tick) {
        if (tick % BOARD_TICK_SPEED)
            return true;

        var changed = [];
        // start 1 row to last (last row will not move anymore)
        for (var i = this._size - this._width; i >= 0; i--) {
            if (this._data[i] == 0x00)
                continue;

            switch (this._data[i] & Board.CODES.forms.mask) {
                // if the pill is left
                case Board.CODES.forms.values.left.code:
                    // check if it can move this one and the other half down
                    var t = i + this._width;
                    var t2 = t - 1;
                    var i2 = i - 1;
                    if (this._data[t] == 0x00 && this._data[t2] == 0x00) {
                        this._data[t] = this._data[i];
                        this._data[t2] = this._data[i2];
                        this._data[i] = 0x00;
                        this._data[i2] = 0x00;
                        changed.push(i);
                        changed.push(i2);
                    }
                    break;

                // if the pill is up or alone
                case Board.CODES.forms.values.up.code:
                    // check if it can move down
                    var t = i + this._width;
                    if (this._data[t] == 0x00) {
                        var p = i - this._width;
                        this._data[t] = this._data[i];
                        // TODO handle top alone pill?
                        this._data[i] = this._data[p];
                        this._data[p] = 0x00;
                        changed.push(t);
                        changed.push(i);
                    }
                    break;

                case Board.CODES.forms.values.single.code:
                    // check if it can move down
                    var t = i + this._width;
                    if (this._data[t] == 0x00) {
                        this._data[t] = this._data[i];
                        this._data[i] = 0x00;
                        changed.push(t);
                    }
                    break;
            }
        }

        /*
        for (var i = 0; i < changed.length; i++) {
            var c = this.posToCoord(changed[i]);
            this._checkPillDestruction(c.x, c.y);
        }
        */

        if(changed.length) {
            Sounds.play("fall");
        }

        return changed.length > 0;
    };

    Board.prototype.releaseOwnedPill = function() {
        this._ownedPill._move({
            a: (this._ownedPill.a & (0xff ^ Board.CODES.states.mask)) | Board.CODES.states.values.dead.code,
            b: (this._ownedPill.b & (0xff ^ Board.CODES.states.mask)) | Board.CODES.states.values.dead.code,
        });

        var bPos = this._ownedPill.getBPos();
        if(this._ownedPill.y <= 2 || bPos.y <= 2) {
            // look if this pill is the only one above the line #3
            var found = false;
            for(var y=0;y<3;y++) {
                for(var x=0; x<this._width; x++) {
                    if((x == bPos.x && y == bPos.y) || (x == this._ownedPill.x && y==this._ownedPill.y) ) {
                        continue;
                    }
                    else if(this._data[y*this._width+x] !== 0x00) {
                        found = true;
                        break;
                    }
                }
            }
            
            if(!found) {
                // play the warning sound
                Sounds.play("warning")
            }
        }

        this._ownedPill = null;
    };

    Board.prototype.tick = function (tick) {
        // reset some stats
        this._stats.combos = [];
        this._stats.explosions = 0;
        this._stats.virus = 0;

        // cleanup completed explosion
        this.each_raw(function (code, i) {
            switch(code & Board.CODES.forms.mask) {
                case Board.CODES.forms.values.virus.code:
                    this._stats.virus++;
                    break;
            
                case Board.CODES.forms.values.exploding.code:
                    this._data[i] = (code & (0xFF ^ Board.CODES.forms.mask)) | Board.CODES.forms.values.exploded.code;
                    break;

                case Board.CODES.forms.values.exploded.code:
                    this._data[i] = 0x00;
            }
        }.bind(this));

        if (this._ownedPill) {
            if (this._ownedPill.tick(tick) == Pill.TICK.STUCK) {
                this.releaseOwnedPill();
            }
        }

        // if no current main pill is in effect, tick the rest
        else {
            if (this._generateNextOwnPillOn > 0) {
                if (this._generateNextOwnPillOn <= tick) {
                    this._generateNextOwnPillOn = 0;
                    // insert a new pill
                    if(!this.insertNextPill())
                        this._stats.gameOver = true;
                }
            }
            else if (!this.tickBoard(tick)) {
                // reset virus count
                this._stats.virus = 0;

                // see if we need to destroy some pills!
                // gather stats about the current state of the game
                for (var i = this._size - 1; i >= 0; i--) {
                    // skip empty cell
                    if(this._data[i] == 0x00)
                        continue;

                    var c = this.posToCoord(i);

                    var currentForm = this._data[i] & Board.CODES.forms.mask;

                    if(
                        currentForm == Board.CODES.forms.values.exploding.code
                        || currentForm == Board.CODES.forms.values.exploded.code
                    )
                        continue;
                    

                    var explosionCount = this._checkPillDestruction(c.x, c.y);
                    if(explosionCount) {
                        console.debug("Pushing Combos");
                        Sounds.play("destroy");
                        this._stats.counting_combos.push(this._data[i] & Board.CODES.colors.mask);
                    }
                    this._stats.explosions += explosionCount;

                    switch(this._data[i] & Board.CODES.forms.mask) {
                        case Board.CODES.forms.values.virus.code:
                            this._stats.virus++;
                            break;
                    }
                }

                if (!this._stats.explosions) {
                    // process combos
                    if(this._stats.counting_combos.length) {
                        console.debug("Assigning Combos");
                        if(this._stats.counting_combos.length>1) {
                            Sounds.play("combo1");
                        }
    
                        this._stats.combos = this._stats.counting_combos;
                        this._stats.counting_combos = [];
                    }
                    // look if we need to add the penalitity / handicap
                    if(this._processExternalHandicap()) {   
                        // queue next one
                        this._generateNextOwnPillOn = tick + this._effective_speed;
                        //window.debug.set("Generate Next Pill",this._generateNextOwnPillOn);
                    }
                }
            }
        }

        return this._stats;
    };

    /**
     * Queue pellet to be dropped on the board after the cuirrent pill touches the ground
     */
    Board.prototype.queueHandicap = function(...codes) {
        for(var i=0;i<codes.length && this._handicaps.length < 4; i++) {
            this._handicaps.push(codes[i] & Board.CODES.colors.mask);
        }
        Sounds.play("combo2");
    };

    Board.prototype._processExternalHandicap = function() {
        var l=this._handicaps.length
        if(l) {
            var step = this._width/l;
            for(var i=0; i<l; i++) {
                var x = Math.floor(Math.random()*step) + i*step;
                this._data[x] = this._handicaps[i];
            }

            // clear handicaps, they were processed
            this._handicaps = [];

            // handicap were processed, preventing next pill deployment
            return false;
        }

        // done processing handicaps, allowing next pill to be dropped
        return true;
    };

    Board.prototype.action = function (method) {
        if (!this._ownedPill) {
            console.warn("Action " + method + " occured but no _ownPill yet");
            return;
        }

        this._ownedPill[method]();
        if (method == "sink") {
            this.releaseOwnedPill();
        }
    };

    Board.prototype.queueNextPill = function () {
        this._nextPill = new Pill(
            this,
            this._effective_speed,
            Math.floor(Math.random() * Board.CODES.colors.mask) + 1 | Board.CODES.forms.values.right.code | Board.CODES.states.values.alive.code,
            Math.floor(Math.random() * Board.CODES.colors.mask) + 1 | Board.CODES.forms.values.left.code | Board.CODES.states.values.alive.code
        );
    };

    Board.prototype.insertNextPill = function () {
        var x = (this._width / 2) - 1;
        var y = 0;

        if (this.isEmptySpace(x, y) && this.isEmptySpace(x + 1, y)) {
            this._ownedPill = this._nextPill;
            this._ownedPill._move({ x: x, y: y });
            this.queueNextPill();
            return true;
        }
        else {
            return false
        }
    };

    Board.prototype.isValidCoord = function (x, y) {
        if (
            x < 0
            || x >= this._width
            || y < 0
            || y > this._height
        )
            return false;
        return true;
    };

    Board.prototype.isEmptySpace = function (x, y) {
        // out of bound
        if (!this.isValidCoord(x, y))
            return false;

        return this._data[this.coordToPos(x, y)] == 0x00;
    };

    /** Go over each slot of internal grid, and call the handle
     * function on every value that is not an empty cell.
     * Will also pass along the coordinate of that cell
     */
    Board.prototype.each = function (handle) {
        this.each_raw(function (code, i) {
            var pos = this.posToCoord(i);
            handle(code, pos.x, pos.y);
        }.bind(this));
    };

    Board.prototype.each_raw = function (handle) {
        for (var i = 0; i < this._size; i++) {
            if (this._data[i] !== 0x00) {
                handle(this._data[i], i);
            }
        }
    };

    /** Helper function to inspect the grid */
    Board.prototype.posToCoord = function (pos) {
        var y = Math.floor(pos / this._width);
        var x = pos - y * this._width;
        return { x: x, y: y };
    };

    Board.prototype.coordToPos = function (x, y) {
        return typeof (x) === "object" ? (x.y * this._width + x.x) : (y * this._width + x);
    };

    Board.prototype.getColorOf = function (x, y) {
        return this.isValidCoord(x, y) ? this._data[this.coordToPos(x, y)] & Board.CODES.colors.mask : null;
    };

    /** return the position offset for the cell facing the code describe here */
    Board.posOffset = function (code) {
        var f = code & Board.CODES.forms.mask;
        var o = { x: 0, y: 0 };
        switch (f) {
            case Board.CODES.forms.values.up: o.y--; break;
            case Board.CODES.forms.values.right: o.x++; break;
            case Board.CODES.forms.values.down: o.y--; break;
            case Board.CODES.forms.values.left: o.x--; break;
        }

        return o;
    };

    /** Returns how many cell are the same color as the targeted one,
     * in each direction, not counting the current
     */
    Board.prototype.getColorLength = function (x, y) {
        var c = this.getColorOf(x, y);
        var r = { u: 0, d: 0, l: 0, r: 0 };

        if (c) {
            for (var i = x + 1; i < this._width && this.getColorOf(i, y) == c; i++) r.r++;
            for (var i = x - 1; i >= 0 && this.getColorOf(i, y) == c; i--) r.l++;
            for (var i = y + 1; i < this._height && this.getColorOf(x, i) == c; i++) r.d++;
            for (var i = y - 1; i >= 0 && this.getColorOf(x, i) == c; i--) r.u++;
        }

        return r;
    };

    /** Generator functions */

    /** Randomly place a certain amount of viruses,
     * based on a difficulty level. Will prevent more
     * than 2 of the same color side by side
     */
    Board.prototype.generatorFromDifficulty = function (difficulty) {
        var virusCount = difficulty * 4;

        var density = virusCount / (this._height * this._width);
        if (density > .75) {
            throw new Error("Invalid difficulty, to high");
        }

        // calculate how much space to leave empty at the top of the bottle
        var reservedEmpty = Math.floor((1 - density) / 2 * this._height);
        var randColorStart = Math.floor(Math.random() * Board.CODES.colors.mask);
        return function (generatedCount) {
            if (virusCount <= generatedCount) {
                return null;
            }

            var j;

            while (true) {
                var j = reservedEmpty * this._width;
                var pos = Math.floor(Math.random() * ((this._width * this._height) - generatedCount - j));
                var orgPos = pos;

                // go over the board, skip the position already alocated
                for (; j < this._size && pos > 0; j++) {
                    if (this._data[j] == 0x00) {
                        pos--;
                    }
                };

                // skip the last remaining viruses, if any
                while (j < this._size && this._data[j] != 0x00) {
                    j++;
                }

                this._data[j] = (((generatedCount + randColorStart) % Board.CODES.colors.mask) + 1) | Board.CODES.forms.values.virus.code;

                // validate color length. if length is more than 1, skip this iteration
                var c = this.posToCoord(j);
                var l = this.getColorLength(c.x, c.y);
                if (l.u + l.d > 1 || l.r + l.l > 1) {
                    this._data[j] = 0x00;
                    continue;
                }

                break;
            }

            return [
                j,
                this._data[j],
                orgPos
            ];
        }.bind(this);
    }

    /** Rebuild a level from a stored version */
    Board.prototype.generatorFromHistory = function (compressed_history) {
        var history = atob(compressed_history);
        var idx = 0;
        var len = history.length;
        return function (i, j) {
            if (idx >= len)
                return null;

            return [
                history.charCodeAt(idx++),
                history.charCodeAt(idx++),
                history.charCodeAt(idx++)
            ];
        }
    }

    /** Add virus to the board, spreading them around randomly */
    Board.prototype.fillInVirus = function (generator) {
        switch (typeof (generator)) {
            case "number":
                generator = this.generatorFromDifficulty(generator);
                break;
            case "string":
                generator = this.generatorFromHistory(generator);
                break;
        }

        // clear old game
        if(typeof(this._data.fill)!=="function") {
            for(var i=0;i<this._data.length;i++)
                this._data[i] = 0x00;
        }
        else {
            this._data.fill(0x00);
        }
        this._lvl_history = [];

        for (var i = 0, x = generator(i); x !== null; x = generator(++i)) {
            // assign code to desired position
            this._data[x[0]] = x[1];

            var c = this.posToCoord(x[0]);
            var l = this.getColorLength(c.x, c.y);


            var row = String.fromCharCode(x[0]) + String.fromCharCode(x[1]) + String.fromCharCode(x[2]);
            if (row.length > 3) {
                console.error("We have a problem");
                debugger;
            }
            this._lvl_history.push(row);
        }

        console.log("lvl id: " + this.getLvl());
    };

    Board.prototype.fill = function (x, y, c) {
        if (typeof (c) === "undefined")
            c = 0x00;
        this._data[this.coordToPos(x, y)] = c;
    };

    /** Return a compressed representation of the original virus layout */
    Board.prototype.getLvl = function () {
        return btoa(this._lvl_history.join(""));
    };

    
    // monkey patch for firefox
    function cloneArray(src) {
        if(typeof(src.slice) !== "function") {
            var res;
            if (typeof (Uint8Array) !== "undefined")
                res = new Uint8Array(src.length);
            else
                res = new Array(src.length);

            for(var i=0;i<src.length;i++)
                res[i] = src[i];
            
            return res;
        }
        else {
            return src.slice();
        }
    }

    function pactArray(src) {
        if(typeof(Uint8Array.from) !== "function") {
            return cloneArray(src);
        }
        else {
            return Uint8Array.from(src);
        }
    }

    /**
     * Return a compressed version of the changes made to the board
     * Every bytes returned with significant data will have it's most
     * significant bit to 0.
     * 
     * Compression will be used (based on the previous frame), only
     * sending the updated cells. If a byte with the most significant
     * bit is set to 1, the value ( &0x7F ) is a count for how many
     * time to repeat the next value
     */
    Board.prototype.getNewFrame = function (forceReferenceFrame) {
        var frame = null;
        var currentFrame = cloneArray(this._data);

        if (this._previousFrame && (typeof (forceReferenceFrame) === "undefined" || !forceReferenceFrame)) {
            var frame = new Array();

            var zeroCounts = 0;
            for (var i = 0; i < this._size; i++) {
                if (this._previousFrame[i] == currentFrame[i]) {
                    zeroCounts++;
                }
                else {
                    // put in the zeros
                    if (zeroCounts) {
                        // set most significant bit to indicate this is repetitive
                        frame.push(zeroCounts | 0x80);

                        zeroCounts = 0;
                    }
                    // then add the current value
                    frame.push(currentFrame[i]);
                }
            }
            frame = pactArray(frame);
        }
        else {
            frame = cloneArray(currentFrame);
        }

        // keep a copy of what it is now to to send it back
        this._previousFrame = currentFrame;

        // keep the frame in internal memory
        this._film.push(frame);
        this._filmWeight += frame.length;
        //window.debug.set("FILM SIZE", this._filmWeight);

        return frame;
    };

    
    Board.prototype.playFrame = function(frame) {
        var j = 0;
        var updated=0;
        for(var i=0;i<frame.length;i++) {
            // decompress
            if(frame[i] & 0x80) {
                j += (frame[i] & 0x7f);
            }
            else {
                updated++;
                this._data[j++] = frame[i];
            }
        }

        return updated;        
    };

    Board.prototype.getVirusCount = function() {
        var virusCount = 0;
        for(var i=0;i<this._size;i++) {
            if((this._data[i] & Board.CODES.forms.mask) == Board.CODES.forms.values.virus.code)
                virusCount++;
        }
        return virusCount;
    };
    /**
     * Generate a base64 encoded version of the film of this game
     */
    Board.prototype.wrapUpFilm = function() {
        var film = [];
        for(var i=0; i<this._film.length;i++) {    
            film.push(btoa(this._film[i].join("")));
        }

        return film.join(".");
    };

    /**
     * Describe the possible values for each cell of the game area
     * the most siginificant bit should not be used.
     */
    Board.CODES = {
        colors: {
            mask: 0b00000011,
            values: {
                red: {
                    code: 0b00000001,
                    dx: 0
                },
                blue: {
                    code: 0b00000010,
                    dx: 16
                },
                yellow: {
                    code: 0b00000011,
                    dx: 8
                }
            }
        },
        forms: {
            mask: 0b00011100,
            values: {
                single: {
                    code: 0b00000000,
                    dy: 32
                },
                up: {
                    code: 0b00000100,
                    dy: 8
                },
                right: {
                    code: 0b00001000,
                    dy: 16
                },
                down: {
                    code: 0b00001100,
                    dy: 0
                },
                left: {
                    code: 0b00010000,
                    dy: 24
                },
                virus: {
                    code: 0b00010100,
                    dy: [48, 56]
                },
                exploding: {
                    code: 0b00011000,
                    dy: 40
                },
                exploded: {
                    code: 0b00011100,
                    dy: 64
                }
            }
        },
        states: {
            mask: 0b00100000,
            values: {
                alive: {
                    code: 0b00100000,
                    oy: 1,
                    ox: 1
                },
                dead: {
                    code: 0b00000000,
                    oy: 1,
                    ox: 1
                }
            }
        }
    };

    Board.rotate = function (code, counterClockwise) {
        var f = (code & Board.CODES.forms.mask) >> 2;
        f = f + (counterClockwise ? 1 : -1);
        if (f <= 0)
            f = 4;
        else if (f > 4)
            f = 1;

        f <<= 2;

        return f | (code & (0xFF ^ Board.CODES.forms.mask));
    };

    var sprite = null;

    /** Render a cell on the context, based on the code, located at rect */
    Board.renderSprite = function (context, code, tick) {
        if (code == 0x00)
            return;

        var x=0, y=0;

        if(sprite === null)
            sprite = document.getElementById("sprite");

        // get the right color offset
        var c = code & Board.CODES.colors.mask;
        var ix = 0, iy = 0;
        for (var k in Board.CODES.colors.values) {
            if (c == Board.CODES.colors.values[k].code) {
                ix = Board.CODES.colors.values[k].dx;
                break;
            }
        }

        // get the right form offset
        var f = code & Board.CODES.forms.mask;
        for (var k in Board.CODES.forms.values) {
            if (f == Board.CODES.forms.values[k].code) {
                iy = Board.CODES.forms.values[k].dy;
                break;
            }
        }

        // get the state offset
        /*
        var s = code & Board.CODES.states.mask;
        for (var k in Board.CODES.states.values) {
            if (s == Board.CODES.states.values[k].code) {
                x += Board.CODES.states.values[k].ox;
                y += Board.CODES.states.values[k].oy;
                break;
            }
        }
        */

        // animate if required
        if (iy instanceof Array)
            iy = iy[Math.floor(tick * ANIMATION_TICK_MULTIPLIER) % iy.length];

        // draw it!
        context.drawImage(sprite, ix, iy, 8, 8, x, y, x+8, y+8);
    };

    Board.renderPreviewSprite = function(context, code, tick) {
        if(!code)
            return;

        var isVirus = code & Board.CODES.forms.mask == Board.CODES.forms.values.virus.code;
        switch(code & Board.CODES.colors.mask) {
            case Board.CODES.colors.values.red.code:
                context.fillStyle = isVirus ? "#a23048" : "#d84060";
                break;
            case Board.CODES.colors.values.yellow.code:
                context.fillStyle = isVirus ? "#ae9c18" : "#e8d020";
                break;
            case Board.CODES.colors.values.blue.code:
                context.fillStyle = isVirus ? "#4878bf" : "#60a0ff";
                break;
        }

        context.fillRect(0,0,2,2);
    };

    global[ns] = Board;
}).apply(null,typeof(window) !== "undefined" ? [this, "Board"] : [module,"exports"]);

(function (global, ns) {
    var BOTTLE_WIDTH = 8;
    var BOTTLE_HEIGHT = 16;
    var SQUARE_LENGTH = 8;
    var PREVIEW_SQUARE_LENGTH = 2;

    var RECORD_REFERENCE_FRAME_EVERY = 512;

    var PADDING = {
        TOP: SQUARE_LENGTH * 5,
        LEFT: SQUARE_LENGTH * 1,
        RIGHT: SQUARE_LENGTH * 5,
        BOTTOM: SQUARE_LENGTH * 1
    };

    var PADDING_BOTTLE_ONLY = {
        TOP: SQUARE_LENGTH * 5,
        LEFT: SQUARE_LENGTH * 1,
        RIGHT: SQUARE_LENGTH * 1,
        BOTTOM: SQUARE_LENGTH * 1
    };

    var PREVIEW_PADDING = {
        TOP: PREVIEW_SQUARE_LENGTH * 5,
        LEFT: PREVIEW_SQUARE_LENGTH * 1,
        RIGHT: PREVIEW_SQUARE_LENGTH * 5,
        BOTTOM: PREVIEW_SQUARE_LENGTH * 1
    };

    var NEXT_PILL_X = SQUARE_LENGTH * (BOTTLE_WIDTH + 2);
    var NEXT_PILL_Y = SQUARE_LENGTH * 2;

    var NEW_PILL_X = (BOTTLE_WIDTH + PADDING.LEFT + PADDING.RIGHT / 2) - 1;
    var NEW_PILL_Y = PADDING.TOP;

    var spriteForm = {
        bottle: [24, 0, 178 - 98, 363 - 187]
    };

    var sprite = document.getElementById("sprite");

    /**
     * Represent a play area - either controlled by the player or over network
     * @param {object}  options       Initialization params
     * @param {float}   options.scale The size of the content
     * @param {DOMELEM} options.root  where to append our html
     */
    function PillBottle(options) {
        this._scale = options && options.scale || 1;
        this._bottleonly = options && options.bottleonly || false;

        this.initUI(
            options && options.root || document.getElementsByTagName("body")[0],
            options && options.title || null
        );

        this._board = new Board({
            width: BOTTLE_WIDTH,
            height: BOTTLE_HEIGHT
        });

        this._recording = false;
        this._stream_to = [];
        this._preview_only = false;
    }

    PillBottle.prototype.destroy = function() {
        if(this._root.parentElement)
            this._root.parentElement.removeChild(this._root);
    };

    PillBottle.prototype.record = function () {
        this._recording = true;
    };

    PillBottle.prototype.stopRecording = function () {
        this._recording = false;
        return this._board._film;
    };

    PillBottle.prototype.initUI = function (root, title) {
        root.appendChild(
            this._root = document.createElement("div")
        );

        if(title) {
            var titleElem=document.createElement("h3");
            titleElem.textContent = title;
            this._root.appendChild(titleElem);
        }

        this._root.appendChild(
            this._status = document.createElement("div")
        );

        this._root.appendChild(
            this._canvas = document.createElement("canvas")
        );

        this._root.appendChild(
            this._msg = document.createElement("div")
        );

        this._root.className = "pill-bottle-root";
        this._status.className = "pill-bottle-status";
        this._canvas.className = "pill-bottle-canvas";
        this._msg.className = "pill-bottle-msg";

        this._preview_only=true;
        this.preview(false);

        this._context = this._canvas.getContext("2d");
        this.setMessage(null);
    };



    PillBottle.prototype.setMessage = function(msg) {
        if(msg) {
            this._msg.textContent = msg;
            this._msg.style.display = "block";
        }
        else {
            this._msg.textContent = "";
            this._msg.style.display = "none";
        }
    };

    PillBottle.prototype.setStatus = function(status) {
        if(status) {
            this.status.textContent = status;
            //this.status.style.display = "block";
        }
        else {
            this.status.textContent = "";
            //this.status.style.display = "none";
        }
    };

    PillBottle.prototype.registerInputs = function (inputs) {
        this._board.registerInputs(inputs);
    };

    PillBottle.prototype.generateForDifficulty = function (difficulty) {
        if(isNaN(difficulty) || difficulty > 20)
            difficulty = 10;
        this._board.fillInVirus(difficulty);
    };

    PillBottle.prototype.loadLvl = function (lvl) {
        this._board.fillInVirus(lvl);
    };

    PillBottle.prototype.streamTo = function (handle) {
        this._stream_to.push(handle);
    };

    PillBottle.prototype.stopStreaming = function (handle) {
        for (var i = 0; i < this._stream_to.length; i++)
            if (this._stream_to[i] === handle)
                this._stream_to.splice(i--, 1);

    };

    PillBottle.prototype.generateStreamHandler = function () {
        var tick = 0;
        return function (frame) {
            tick++;
            var updated = this._board.playFrame(frame);
            if (updated) {
                this.render(tick);
                // look at virus count
                this.updateVirusCount(this._board.getVirusCount());
            }
        }.bind(this);
    };

    PillBottle.prototype.updateVirusCount = function(count) {
        this._status.textContent =
            "Virus" + (count>1?"es":"") +
            (this._preview_only || this._bottleonly ? "" : " Remaining: ")
            + count;
    };

    PillBottle.prototype.tick = function (tick) {
        var tickStats = this._board.tick(tick);

        // TODO look to offload this to a new worker
        if (this._recording) {
            var frame = this._board.getNewFrame(tick / RECORD_REFERENCE_FRAME_EVERY == 0);
            for (var i = 0; i < this._stream_to.length; i++) {
                this._stream_to[i](frame);
            }
        }

        if (!this._last_virus_count || this._last_virus_count != tickStats.virus)
            this.updateVirusCount(tickStats.virus);

        this._last_virus_count = tickStats.virus;

        return tickStats;
    };

    PillBottle.prototype.preview = function(state) {
        if(state || typeof(state) === "undefined") {
            if(!this._preview_only) {
                this._preview_only = true;
                this._root.className = "pill-bottle-root pill-bottle-preview";
                this._canvas.width = BOTTLE_WIDTH * PREVIEW_SQUARE_LENGTH + PREVIEW_PADDING.RIGHT + PREVIEW_PADDING.LEFT;
                this._canvas.height = BOTTLE_HEIGHT * PREVIEW_SQUARE_LENGTH + PREVIEW_PADDING.TOP + PREVIEW_PADDING.BOTTOM;
            }
        }
        else {
            if(this._preview_only) {
                this._preview_only = false;
                this._root.className = "pill-bottle-root";
                
                if(this._bottleonly) {
                    this._canvas.width = BOTTLE_WIDTH * SQUARE_LENGTH + PADDING_BOTTLE_ONLY.RIGHT + PADDING_BOTTLE_ONLY.LEFT;
                    this._canvas.height = BOTTLE_HEIGHT * SQUARE_LENGTH + PADDING_BOTTLE_ONLY.TOP + PADDING_BOTTLE_ONLY.BOTTOM;
                }
                else {
                    this._canvas.width = BOTTLE_WIDTH * SQUARE_LENGTH + PADDING.RIGHT + PADDING.LEFT;
                    this._canvas.height = BOTTLE_HEIGHT * SQUARE_LENGTH + PADDING.TOP + PADDING.BOTTOM;
                }
                if (this._scale != 1) {
                    this._canvas.height *= this._scale;
                    this._canvas.width *= this._scale;
                }
            }
        }
    };

    PillBottle.prototype.render = function (tick) {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        this._context.save();
        this._context.scale(this._scale, this._scale);

        var width = this._preview_only ?
            (this._canvas.width/this._scale) - PREVIEW_PADDING.RIGHT + PREVIEW_PADDING.LEFT + 1 :
            (
                this._bottleonly ?
                (this._canvas.width/this._scale) - PADDING_BOTTLE_ONLY.RIGHT + PADDING_BOTTLE_ONLY.LEFT + 1 :
                (this._canvas.width/this._scale) - PADDING.RIGHT + PADDING.LEFT + 1
            );


        // draw bottle
        this._context.drawImage(
            sprite,
            spriteForm.bottle[0],
            spriteForm.bottle[1],
            spriteForm.bottle[2],
            spriteForm.bottle[3],
            0, 0, Math.floor(width), Math.floor(this._canvas.height/this._scale) + 1);

        // draw pills
        this._board.each(function (renderMethod, sprite_size, padding, code, x, y) {
            this._context.save();
            this._context.translate(
                x*sprite_size+padding.LEFT,
                y*sprite_size+padding.TOP
            );

            Board[renderMethod]( this._context, code, tick );

            this._context.restore();
        }.bind(
            this,
            this._preview_only ? "renderPreviewSprite" : "renderSprite",
            this._preview_only ? PREVIEW_SQUARE_LENGTH : SQUARE_LENGTH,
            this._preview_only ? PREVIEW_PADDING : PADDING
        ));

        // TODO move this to not use private attribute
        // make required transformation to draw the next pill
        if (this._board._nextPill) {

            this._context.save();
            if (this._board._generateNextOwnPillOn == 0) {
                this._context.translate(NEXT_PILL_X, NEXT_PILL_Y);
            }
            else {
                var time = this._board._effective_speed - (this._board._generateNextOwnPillOn - tick);
                this._context.translate(
                    this.getNextPillX(NEXT_PILL_X, NEW_PILL_X, time, this._board._effective_speed),
                    this.getNextPillY(NEXT_PILL_Y, NEW_PILL_Y, time, this._board._effective_speed)
                );
                this._context.rotate(-time);
            }

            // Draw the next pill
            Board.renderSprite(this._context, this._board._nextPill.a, tick);
            this._context.translate(SQUARE_LENGTH, 0);
            Board.renderSprite(this._context, this._board._nextPill.b, tick);

            this._context.restore();
        }
        this._context.restore();
    };

    PillBottle.prototype.getNextPillX = function (sx, dx, time, delay) {
        if (time > delay - 2)
            return dx;

        return sx - ((sx - dx) / (delay - 2) * time);
    };

    PillBottle.prototype.getNextPillY = function (sy, dy, time, delay) {
        // todo put in a formula instead of those hardcoded values?
        switch (time) {
            case 0: return 12;
            case 1: return 8;
            case 2: return 8;
            case 3: return 8;
            case 4: return 8;
            case 5: return 8;
            case 6: return 24;
            case 7: return 40;
            default: return dy;
        }
    };

    global[ns] = PillBottle;
})(this, "PillBottle");

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
                .appendChild(this._root = document.createElement("div"));
        }

        this._root.appendChild(
            this._status = document.createElement("div")
        );
        this._status.className = "game-status";
        this._status.style.display = "none";

        this._fps = 16;

        this._fps_interval = 1000 / this._fps;
        this._fps_then = 0;

        this._root.className = (this._root.className ? this._root.className + " " : "") + "dr-mario";

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

        switch(this._control_used = menu.get("controls")) {
            case "swipe": this.bindTouch(); break;
            case "tap": this.enableTap(); break;
            default:;
        }
    };

    DrMario.prototype.stop = function () {
        Sounds.stopGroup("bg");
        this.allowScrolling();
        this._running = false;
        switch(this._control_used) {
            case "swipe": this.releaseTouch(); break;
            case "tap": this.disableTap(); break;
            default:;
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

    DrMario.prototype.enableTap = function() {
        this.disableTap();
        this._tapController = new TapController(document.getElementsByTagName("body")[0], this._inputs);
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
/**
 * Provide connectivity to the server and add feature for the Multiplayer mode
 */

(function (global, ns){
    "use strict";

    var uuid = preference("multi-uuid", null);
    if(!uuid) {
        preference.set("multi-uuid",uuid = uuidv1());
    }

    function Multiplayer(game) {
        this._socket = io();
        this._game = game;
        this._name = null;
        this._difficulty = 1;
        this._opponents = [];
        menu.init.then(function(){
            menu.set("opponents", this._opponents);
        }.bind(this))
        
        // estimated sizes
        var mainBottleWidth = 250;
        var smallBottleWidth = 80;
        var windowWidth = window.innerWidth > 512 ? 512 : window.innerWidth;
        this._fullSizeSpace = Math.floor((windowWidth - mainBottleWidth) / smallBottleWidth);

        this._socket.on("error",this.error.bind(this));

        // bind all `on_` method of this class
        for(var k in Multiplayer.prototype) {
            var m = k.match(/^(on(?:ce)?)_(.+)$/);
            if(m) {
                this._socket[m[1]](m[2],this[k].bind(this));
            }
        }

        this._game.onGameOver(function(state) {
            if(state) {
                this._socket.emit("victory");
            }
            else {
                this._socket.emit("defeat");
            }
            //return false;
        }.bind(this));
    }

    Multiplayer.prototype.error = function(err) {
        alert("Error occured:" + err);
    };

    Multiplayer.prototype.setGameRule = function(rule) {
        this._socket.emit("set_game_rules", rule);
    };

    Multiplayer.prototype.join = function(room) {
        this._socket.emit("join", {room:room});
    };

    Multiplayer.prototype.on_joined = function(roomDetails){
        if(roomDetails.error) {
            return this.error(roomDetails.error);
        }

        menu.set("room_uuid", roomDetails.uuid);

        // apply rules if needed
        if(menu.get("hosting")) {
            var game_rules = menu.get("game_rules");
            if(game_rules) {
                this.setGameRule(game_rules);
            }
        }

        if(!menu.get("playing"))
            Sounds.play("wii-select");
        
        var myFrame = null;
        // add the pill bottle of the other players and display their current state
        for(var i=0; i<roomDetails.clients.length; i++ ) {
            // skip us
            if(roomDetails.clients[i].uuid !== uuid) {
                // update internal state of that player
                // run with a separate reference to the object
                (function(client){
                    menu.splice("players",function(player){
                        return player.uuid == client.uuid;
                    }, client);
                })(roomDetails.clients[i]);
                
                // add Opponent
                var opponent = addOpponent.call(this, roomDetails.clients[i]);
                if(roomDetails.clients[i].board) {
                    opponent.bottle._board.playFrame(decodeFrame(roomDetails.clients[i].board));
                }
            }
            else {
                // set ourself not ready?
                menu.set("is_ready", false);

                // set our board to what it was (should happen if we reconnect)
                if(roomDetails.clients[i].board) {
                    myFrame = decodeFrame(roomDetails.clients[i].board);
                    var hasData = false;
                    for(var i=0;i<myFrame.length;i++) {
                        if(myFrame[i] != 0x00) {
                            hasData = true;
                            break;
                        }
                    }
                    if(!hasData)
                        myFrame = null;
                }
            }
        }

        if(roomDetails.gameInProgress) {
            // auto set ready & start my game
            this.readyToStart().then(function(){
                if(myFrame) {
                    this._game._mainPillBottle._board.playFrame(myFrame);
                    this._game._mainPillBottle.record();
                }
                else {
                    this._game.setForMultiPlayer(this._difficulty);
                }
                this._game.run();
            }.bind(this));
            
            // auto start it
            if(roomDetails.startingIn == 0) {
                menu.set("playing", true);
                this._start_resolve && this._start_resolve();
                this._game.setStatus("");
            }
        }

        delete roomDetails.clients;
        var found = false;
        menu.splice("rooms", function(elem){
            if(elem.uuid == roomDetails.uuid)
                return found = true;
            return false;
        },roomDetails).then(function(){
            if(!found)
                menu.push("rooms", roomDetails);
        });
    };

    Multiplayer.prototype._prepareStreaming = function() {
        this._game.prepareMultiPlayer();
        this._game._mainPillBottle.streamTo(function(frame){
            this._socket.emit("frame", encodeFrame(frame));
        }.bind(this));
    };

    Multiplayer.prototype.setDifficulty = function(difficulty) {
        this._difficulty = parseInt(difficulty);
        this._socket.emit("set_difficulty", difficulty);
    };

    Multiplayer.prototype.readyToStart = function() {
        var p = new Promise(function(resolve, reject){
            this._start_resolve = resolve;
            this._start_reject = reject;

            this._socket.emit("ready");
            
            // prepare game for streaming
            this._prepareStreaming();
        }.bind(this));

        var cleanUp = function(){
            this._start_resolve = null;
            this._start_reject = null;
        }.bind(this);
        
        p.then(cleanUp, cleanUp);

        return p;
    };


    Multiplayer.prototype.once_connect = function() {
        menu.init.then(function(){
            menu.set("uuid", uuid);
            this._name = menu.get("multi_name");
            if(!this._name) {
                this._name = prompt("Please input your name:");
            }
            
            if(!this._name) {
                pickRandomName().then(function(name) {
                    this._name = name;
                    menu.set("multi_name",this._name);
                    authenticate.call(this);
                }.bind(this));
            }
            else {
                menu.set("multi_name",this._name);
                authenticate.call(this);
            }
        }.bind(this));
    };

    Multiplayer.prototype.on_reconnect = function() {
        authenticate.call(this);
    };

    Multiplayer.prototype.kick = function(player_uuid) {
        this._socket.emit("kick", player_uuid);
    };

    Multiplayer.prototype.on_kicked = function() {
        menu.set("room_uuid", null);
    };

    Multiplayer.prototype.virusCountUpdated = function() {
        // only if we have more opponent that we can fit
        if(this._opponents.length > this._fullSizeSpace) {
            var counts = [];
            for(var i=0;i<this._opponents.length;i++)
                counts.push([i,this._opponents[i].virus]);
            
            var sorted = counts.sort(function(a,b){ return b[1]-a[1]; });
            var parent = this._opponents[0].bottle._root.parentElement;
            var elems = [];
            for(var i=1;i<this._fullSizeSpace && i < sorted.length ;i++) {
                var idx = sorted.pop()[0];
                this._opponents[idx].bottle.preview(false);
                parent.removeChild(this._opponents[idx].bottle._root);
                elems.push(idx);
            }

            // re-order
            while(elems.length) {
                var idx = elems.pop();
                if(!parent.firstChild) {
                    parent.appendChild(this._opponents[idx].bottle._root);
                }
                else {
                    parent.insertBefore(this._opponents[idx].bottle._root, parent.firstChild);
                }
            }

            // enable preview on the rest of them
            while(sorted.length)
                this._opponents[sorted.pop()[0]].bottle.preview();
        }
        else {
            for(var i=0;i<this._opponents.length;i++)
                this._opponents[i].bottle.preview(false);    
        }
    };

    function addOpponent(data) {
        for(var i=0;i<this._opponents.length;i++) {
            if(this._opponents[i].id == data.id) {
                console.warn("Ignoring duplicate opponent " + data.name);
                return;
            }
        }

        console.debug(data.name, "is ready to play");

        var bottle = new PillBottle({
            root:document.getElementById("opponents"),
            title: data.name,
            bottleonly: true
        });

        var opponent = {
            id: data.id,
            name: data.name,
            uuid: data.uuid,
            bottle: bottle,
            virus: 256
        };

        this._opponents.push(opponent);

        var handle = bottle.generateStreamHandler();
        this.virusCountUpdated();
        this._socket.on("frame-"+data.id, function(encoded) {
            handle(decodeFrame(encoded));
            var v = bottle._board.getVirusCount();
            if( opponent.virus != v) {
                opponent.virus = v;
                
                if(v == 3) {
                    Sounds.play("almost_done");
                }

                menu.splice("opponents", function(player){
                    if(opponent.id == player.id) {
                        player.virus = opponent.virus;
                    }
                }.bind(this));
                
                this.virusCountUpdated();
            }
        }.bind(this));

        return opponent;
    }

    Multiplayer.prototype.on_ready = function(data) {
        var room_uuid = menu.get("room_uuid");
        menu.splice("players", function(player){
            if(data.uuid == player.uuid) {
                player.ready = true;

                // check if we are in the same game
                if(player.room && room_uuid && player.room.uuid==room_uuid)
                    addOpponent.call(this,data);
            }
        }.bind(this));
    };

    function encodeFrame(frame) {
        // encode it
        var encoded = "";
        for(var i=0;i<frame.length;i++) 
        encoded += String.fromCharCode(frame[i]);
        return btoa(encoded);
    }

    function decodeFrame(encoded) {
        var frame = [];
        var r = atob(encoded);
        for(var i=0;i<r.length;i++) 
            frame.push(r.charCodeAt(i));
        
        return frame;
    }

    Multiplayer.prototype.on_countdown = function(data) {
        menu.set("playing", true);
        Sounds.stopGroup("bg");
        Sounds.play("move");
        this._start_resolve && this._start_resolve();
        this._game.setStatus("Game starting in " + data.sec + " second" + (data.sec > 1 ? "s" :"" ));
    };

    Multiplayer.prototype.on_start = function(data) {
        menu.set("playing", true);
        this._start_resolve && this._start_resolve();
        this._game.setStatus("");
        this._game.setForMultiPlayer(this._difficulty);
        this._game.run();
    };

    Multiplayer.prototype.on_gameover = function(data) {
        this._game.stop();

        for(var i = 0;i<this._opponents.length;i++) {
            if(this._opponents[i].uuid == data.winner.uuid) {
                this._opponents[i].bottle.setMessage("Winner!");
            }
            else {
                this._opponents[i].bottle.setMessage(":(");
            }
        }

        if(uuid != data.winner.uuid) {
            //Sounds.play("nes-game-lost");
            this._game._mainPillBottle.setMessage("You Lost");
        }
        else {
            //Sounds.play("nes-vs-game-over");
            this._game._mainPillBottle.setMessage("You won!");
        }

        var reset = function() {
            this.resetGame();
            menu.set("playing", false);
            Sounds.play("wii-select");
            document.getElementById("game-grid").removeEventListener("click", reset);
        }.bind(this);

        setTimeout(function(){
            document.getElementById("game-grid").addEventListener("click", reset);
        },1000);
    };

    Multiplayer.prototype.leave = function() {
        this._socket.emit("leave", null, function(){
            menu.set("room_uuid",null);
        });
    };

    Multiplayer.prototype.on_room_created = function(data) {
        menu.push("rooms", data);
        //upsertRoom(data);
    };

    Multiplayer.prototype.on_room_updated = function(data) {
        menu.splice("rooms", function(elem) {
            return elem.uuid == data.uuid;
        }, data);
    };

    Multiplayer.prototype.on_room_removed = function(data) {
        menu.splice("rooms", function(elem) {
            return elem.uuid == data.uuid;
        });
    };

    Multiplayer.prototype.on_room_list = function(data) {
        menu.set("rooms", data.rooms);
    };

    Multiplayer.prototype.on_handicap = function(encoded) {
        console.debug("Queueing Handicap");
        
        this._game._mainPillBottle._board.queueHandicap(...decodeFrame(encoded));
    };

    Multiplayer.prototype.on_client_update = function(data) {
        menu.set("players", data.clients);
    };

    Multiplayer.prototype.on_update_one_client = function(details) {
        if(!details.room) {
            for(var i=0; i < this._opponents.length; i++) {
                if(this._opponents[i].uuid == details.uuid) {
                    this._opponents[i].bottle.destroy();
                    this._opponents.splice(i, 1);
                    break;
                }
            }
        }
        else {
            menu.splice("rooms", function(elem) {
                return elem.uuid == details.room.uuid;
            }, details.room);
        }
            
        menu.splice("players", function(elem){
            return details.uuid == elem.uuid;
        }, details);
    };

    Multiplayer.prototype.on_invited = function(data) {
        menu.push("invitations", data);
    };

    Multiplayer.prototype.on_chat = function(data) {
        menu.push("chats", data);

        // dirty fix to scroll down
        setTimeout(function(){
            var chatBoxes = document.querySelectorAll(".chat-box");
            for(var i=0;i<chatBoxes.length;i++)
                chatBoxes[i].scrollTop = chatBoxes[i].scrollHeight;
        });
    };

    Multiplayer.prototype.chat = function(msg) {
        this._socket.emit("chat", msg);
    };

    Multiplayer.prototype.resetGame = function() {
        for(var i=0; i < this._opponents.length; i++) {
            this._opponents[i].bottle.destroy();
        }
        this._opponents = [];
        menu.set("opponents", this._opponents);
    };

    Multiplayer.prototype.invite = function(player_id) {
        this._socket.emit("invite", {
            players: [ player_id ]
        });
    };

    
    /*
    Multiplayer.prototype.joinPlayer = function(player_id) {
        this._socket.emit("joinPlayer", player_id);
    };
    */
    /*
    Multiplayer.prototype.spectate = function(player_id) {
        this._socket.emit("spectate", player_id);
    };
    */

    Multiplayer.prototype.tick = function(tick) {
        if(this._game._game_stats && this._game._game_stats.combos && this._game._game_stats.combos.length > 1) {
            this._socket.emit("combos", encodeFrame(this._game._game_stats.combos));
        }
    };

    function authenticate() {
        this._socket.emit("authenticate",{
            uuid: uuid,
            name: this._name,
            meta: btoa(JSON.stringify({
                fps: this._game._fps
            }))
        });
    }
/*
    var upsertRoom = generateUpsertElem(
        document.getElementById("multi-room-template"),
        generateRoomID,
        ".room-value-%name%",
        function(elem, obj) {
            elem.setAttribute("room-name", obj.name);
        }
    );

    var upsertPlayer = generateUpsertElem(
        document.getElementById("player-template"),
        generatePlayerID,
        ".player-value-%name%",
        function(elem, obj) {
            if(obj.uuid == uuid) {
                // prevent us from being added
                elem.parentElement.removeChild(elem);
            }
            elem.setAttribute("player-uuid", obj.uuid);
        },
        function(elem, obj){
            elem.className = obj.status;
        }
    );
    
    function generateUpsertElem(template, generateId, field_value_selector, postCreate, postUpdate) {
        var root = template.parentElement;
        root.removeChild(template);

        var fn = function(obj) {
            var id = generateId(obj);
            var elem = document.getElementById(id);
            if(!elem) {
                var elem = template.cloneNode(true);
                elem.setAttribute("id", id);
                root.appendChild(elem);
                if(typeof(postCreate) === "function")
                    postCreate(elem, obj);
            }

            for(var k in obj) {
                var e = document.querySelector("#"+id+" " + field_value_selector.replace("%name%",k));
                if(e)
                    e.innerText = obj[k];
            }

            if(typeof(postUpdate) === "function")
                postUpdate(elem, obj);

            return elem;
        };

        fn.clear = function() {
            while(root.lastChid)
                root.removeChild(root.lastChid);
        };

        fn.removeNotIn = function(list) {
            var nextElem, elem = root.firstChild;
            while(elem) {
                nextElem = elem.nextElementSibling;
                if(list.indexOf(elem) == -1) {
                    root.removeChild(elem);
                }
                elem = nextElem;
            }
        };

        return fn;
    }

    function generateRoomID(room) {
        return "room-row-" + btoa(room.name).replace(/[=+/]/g, "_");
    };

    function generatePlayerID(client) {
        return "player-row-" + client.uuid;
    };
    */
    function pickRandomName() {
        return jsonp("https://randomuser.me/api/?inc=name&noinfo&callback=", 5)
        .then(function(res){
            return res.results[0].name.title + ". " + res.results[0].name.first + " " + res.results[0].name.last;
        }, function(){
            return "John Smith";
        });
    }
    global[ns] = Multiplayer;
})(this, "Multiplayer");

(function (global, ns){
    "use strict";

var menu = {};
var app = angular.module("app",[]);

menu.init = new Promise(function(resolve, reject){
    app.factory("menuInitialized",function(){
        return {
            resolve: resolve,
            reject: reject
        };
    });

    app.factory("pref", function(){
        return function(scope, name, defaultValue, format, onChange) {
            var v = preference(name, defaultValue);
            if(typeof(format) === "function")
                v = format(v);
            
            var parts = name.split(".");
            var parent = scope;
            for(var i=0; i<parts.length-1;i++) {
                if(typeof(parent[parts[i]]) === "undefined")
                    parent[parts[i]] = {};
                parent = parent[parts[i]];
            }

            parent[parts[parts.length-1]] = v;
            
            scope.$watch(name,function(newValue,oldValue){
                if(oldValue != newValue) {
                    preference.set(name, typeof(newValue) === "object" && newValue ? JSON.stringify(newValue): newValue);
                }
                if(typeof(onChange)==="function")
                    onChange.apply(this, arguments);
            });
        };
    });

    app.controller("MenuController",["$scope", "$timeout", "pref", "menuInitialized", MenuController]);
});



function MenuController($scope, $timeout, pref, menuInitialized){

    $scope.settings = {};
    $scope.uuid = null;

    pref($scope,"difficulty", 4, parseInt, function(newValue, oldValue){
        multiplayer.setDifficulty(newValue)
    });
    pref($scope,"sensitivity", 16, parseInt, function(newValue, oldValue){
        game.touch_sensitivity = newValue;
    });
    pref($scope,"controls", "arrows", null, function(newValue, oldValue){
        inputs.clearAll();
        inputs.loadKeyMap($scope.keyMap[newValue].map);
    });
    pref($scope,"soundtrack", "random", null, function(newValue, oldValue) {
        if(newValue != oldValue && newValue != "random" && newValue != "none") {
            Sounds.play(newValue);
        }
    });
    pref($scope,"volume", 1, parseInt, function(newValue, oldValue) {
        Sounds.setVolume(newValue);
    });
    pref($scope,"game_rules.combos", "normal-rr", null, function(newValue, oldValue) {
        if(newValue != oldValue && $scope.hosting) {
            $timeout(function(){
                multiplayer.setGameRule($scope.game_rules);
            },0);
        }
    });
    pref($scope,"multi_name", preference("multi-name",""));
    pref($scope, "enable_sound", "yes", null, function(newValue, oldValue){
        if(newValue=="yes") {
            Sounds.unmute();
            if($scope.room_uuid)
                Sounds.play("wii-select");
            else
                Sounds.play("wii-title");
        }
        else {
            Sounds.mute();
        }
    });

    $scope.players = [];
    $scope.rooms = [];
    $scope.invitations = [];
    $scope.hosting = null;
    $scope.room_uuid = null;
    $scope.playing = false;
    $scope.chats = [];

    menu.get = function(name) {
        return $scope[name];
    };

    menu.set = function(name,value) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                $scope[name] = value;
                resolve();
            });
        });
    };

    menu.push = function(name, value) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                $scope[name].push(value);
                resolve();
            });
        });
    };
    
    menu.splice = function(name, filter, ...replaceWith) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                if(typeof(filter) === "function") {
                    for(var i=0;i<$scope[name].length;i++) {
                        if(filter($scope[name][i])) {
                            $scope[name].splice(i,1, ...replaceWith);
                        }
                    }
                    resolve();
                }
                else {
                    reject(new Error("Invalid splice filter argument"));
                }
            });
        })
    };

    menu.alter = function(name, alter) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                for(var i=0;i<$scope[name].length;i++) {
                    alter($scope[name][i]);
                }
                resolve();
            });
        });
    };


    $scope.invite = function(player) {
        player.invited=true;
        multiplayer.invite(player.uuid);
    };

    $scope.kick = function(player) {
        multiplayer.kick(player.uuid);
    };

    $scope.tryAudio = function() {
        $scope.require_click_to_play = false;
        Sounds.play("wii-title");
        
        Sounds.warmup("dududididu");
        Sounds.warmup("move");
    };

    $scope.backToHome = function() {
        game.abort();
        $scope.playing = false;
        Sounds.play("wii-title");
    };

    $scope.acceptInvitation = function(invitation) {
        $scope.join(invitation.room);
        for(var i=0;i<$scope.invitations.length;i++) {
            if($scope.invitations[i] == invitation)    
                $scope.invitations.splice(i,1);
                break;
        }
    };

    $scope.clearError = function() {
        $scope.error = "";
    };

    $scope.host = function() {
        if($scope.hosting)
            return;
        
        $scope.hosting = true;
        multiplayer.join($scope.multi_name + "'s Game");
    };

    $scope.join = function(room) {
        $scope.hosting = false;
        $scope.room_uuid = null;
        
        $scope.is_ready = false;
        $scope.chats = [];

        multiplayer.join(room.name);
    };

    $scope.ready = function() {
        if($scope.is_ready)
            return;

        game.setSoundTrack(getSoundTrack($scope.soundtrack));
        multiplayer.readyToStart(parseInt($scope.difficulty));
        $scope.is_ready = true;
    };

    $scope.submitChat = function(msg) {
        if(msg)
            multiplayer.chat(msg);
    };

    $scope.startSingle = function() {
        $scope.playing = true;
        game.setSoundTrack(getSoundTrack($scope.soundtrack));
        $timeout(function(){
            game.startSinglePlayer(parseInt($scope.difficulty));
            game.run();
        },0);
    };

    $scope.orderMyRoomFirst = function(item) {
        return item.uuid == $scope.room_uuid ? "" : item.name;
    };


    $scope.preview_tap_controls = function() {
        var tap = new TapController(document.getElementsByTagName("body")[0]);
        tap.display();
        tap._root.addEventListener("click", function(){
            tap.destroy();
        });
    };

    $scope.keyMap = {
        arrows: {
            label: "Arrows + X-Z",
            map: {
                40: "DOWN",
                38: "UP",
                37: "LEFT",
                39: "RIGHT",
                88: "ROTATE_CLOCKWISE",
                90: "ROTATE_COUNTER_CLOCKWISE",
                19: "PAUSE",
                27: "ESC"
            }
        },
        swipe: {
            label: "Swipe",
            map: {
                40: "DOWN",
                38: "UP",
                37: "LEFT",
                39: "RIGHT",
                88: "ROTATE_CLOCKWISE",
                90: "ROTATE_COUNTER_CLOCKWISE",
                19: "PAUSE",
                27: "ESC"
            }
        },
        tap: {
            label: "Tap",
            map: {
                40: "DOWN",
                38: "UP",
                37: "LEFT",
                39: "RIGHT",
                88: "ROTATE_CLOCKWISE",
                90: "ROTATE_COUNTER_CLOCKWISE",
                19: "PAUSE",
                27: "ESC"
            }
        },
        wasd: {
            label: "WASD + ← →",
            map: {
                83: "DOWN",
                87: "UP",
                65: "LEFT",
                68: "RIGHT",
                37: "ROTATE_CLOCKWISE",
                39: "ROTATE_COUNTER_CLOCKWISE",
                19: "PAUSE",
                27: "ESC"
            }
        }
    };

    $scope.gameRules = {
        "normal-rr": {
            "label": "Normal Round Robin",
            "description": "to each opponent, one at a time"
        },
        "roundrobin": {
            "label": "Round Robin",
            "description": "to each player, one at a time (potentially sending it to the sender)"
        },
        "none": {
            "label": "None",
            "description": "to nobody"
        },
        "multiplier": {
            "label": "Multiplier",
            "description": "to all opponents, at the same time"
        },
        "punitive": {
            "label": "Punitive",
            "description": "back to the sender"
        }
    };

    menuInitialized.resolve();
}

function getSoundTrack(soundtrack) {
    if(soundtrack === "random") {
        var options = document.querySelectorAll("#soundtrack option");
        var count = options.length-2;
        var idx = Math.floor(Math.random()*count);
        for(var i=0;i<options.length;i++) {
            if(options[i].value == "none" || options[i].value == "random") {
                continue;
            }
            else if(--idx<=0) {
                return options[i].value;
            }
        }
    }
    else if(soundtrack === "none") {
        return null
    }

    return soundtrack;
}

global[ns] = menu;
return;

})(this, "menu");
// app cache
// Check if a new cache is available on page load.
window.addEventListener("load", function(e) {
    if(!window.applicationCache) {
        menu.set("cache_status","no-cache-ready");
        setTimeout(function(){
            menu.set("cache_status","");
        },1000);
        return;
    }

    // Fired after the first cache of the manifest.
    window.applicationCache.addEventListener("cached", function(ev){
        menu.set("cache_status","ready");
        setTimeout(function(){
            menu.set("cache_status","");
        },1000);
    }, false);

    // Checking for an update. Always the first event fired in the sequence.
    window.applicationCache.addEventListener("checking", function(ev){
        menu.set("cache_status","looking");
    }, false);

    // An update was found. The browser is fetching resources.
    window.applicationCache.addEventListener("downloading", function(ev) {
        menu.set("cache_status","downloading");
    }, false);

    // The manifest returns 404 or 410, the download failed,
    // or the manifest changed while the download was in progress.
    window.applicationCache.addEventListener("error", function(ev){
        if(/manifest\/html5.appcache/.test(ev.url)) {
            // failed to load manifest, do not show that error
            menu.set("cache_status","ready");
            setTimeout(function(){
                menu.set("cache_status","");
            },1000);
            return;
        }

        var err = {};
        for(var k in ev)
            err[k] = ev[k];
        menu.set("error", err);
        menu.set("cache_status_error",ev.message);
        menu.set("cache_status","error");
    }, false);

    // Fired after the first download of the manifest.
    window.applicationCache.addEventListener("noupdate", function(ev){
        menu.set("cache_status","ready");
        setTimeout(function(){
            menu.set("cache_status","");
        },1000);
    }, false);

    // Fired if the manifest file returns a 404 or 410.
    // This results in the application cache being deleted.
    window.applicationCache.addEventListener("obsolete", function(ev){
        menu.set("cache_status","obselete");
    }, false);

    var loaded = 0;
    // Fired for each resource listed in the manifest as it is being fetched.
    window.applicationCache.addEventListener("progress", function(ev){
        menu.set("cache_status","progress");
        menu.set("cache_status_progress",
            typeof(ev.loaded)==="undefined" ?
            { total: "?", loaded: loaded++} :
            { total: ev.total, loaded: ev.loaded }
        );
    }, false);

    window.applicationCache.addEventListener("updateready", function(e) {
      if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
        // Browser downloaded a new app cache.
        menu.set("cache_status","new-available");
      } else {
        // Manifest didn't changed. Nothing new to server.
        menu.set("cache_status","ready");
        setTimeout(function(){
            menu.set("cache_status","");
        },1000);
      }
    }, false);
  
}, false);
"use strict";

// var ws = new WebSocket(window.location.origin.replace(/^http/,"ws") + "/ws");
window.debug = new Debug(document.getElementById("main"));

var inputs = new Inputs().bindKeys();

var game = new DrMario({ root: document.getElementById("main") });
var multiplayer = new Multiplayer(game);

game.registerInputs(inputs);
game.registerForTick(inputs.tick.bind(inputs));
game.registerForTick(debug.tick.bind(debug));
game.registerForTick(multiplayer.tick.bind(multiplayer));

// onscreen controller
//Controller(document.getElementById("main"), inputs);

//menu.init(game, multiplayer, inputs);

Sounds.initialize();
menu.init.then(function(){
    if(menu.get("enable_audio") === "yes")
        Sounds.play("wii-title");
});

