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

    var elements = null;
    var library = {
        "combo1": {
            src: "/assets/sounds/sfx/combo-1.wav"
        },
        "combo2": {
            src: "/assets/sounds/sfx/combo-2.wav"
        },
        "pause": {
            src: "/assets/sounds/sfx/pause.wav"
        },
        "destroy": {
            srcs: [
                [.5,"/assets/sounds/sfx/pill-destroy-1.wav"],
                [.5,"/assets/sounds/sfx/pill-destroy-2.wav"]
            ]
        },
        "almost_done" : {
            src: "/assets/sounds/sfx/almost_done.wav"
        },
        "warning" : {
            src: "/assets/sounds/sfx/warning.mp3"
        },
        "fall": {
            src: "/assets/sounds/sfx/pill-fall.wav",
        },
        "move": {
            src: "/assets/sounds/sfx/pill-move.wav",
        },
        "rotate": {
            src: "/assets/sounds/sfx/pill-rotate.wav",
        },
        /*
        "nes-title":{
            src: "/assets/sounds/01_Title_Theme.mp3",
            async: true,
            group: "bg"
        },
        "nes-select":{
            src: "/assets/sounds/02_Select.mp3",
            async: true,
            group: "bg"
        },
        "nes-fever":{
            src: "/assets/sounds/03_Fever.mp3",
            async: true,
            group: "bg"
        },
        "nes-fever-clear":{
            src: "/assets/sounds/04_Fever_Clear.mp3",
            async: true,
            group: "bg"
        },
        "nes-chill":{
            src: "/assets/sounds/05_Chill.mp3",
            async: true,
            group: "bg"
        },
        "nes-chill-clear":{
            src: "/assets/sounds/06_Chill_Clear.mp3",
            async: true,
            group: "bg"
        },
        "nes-vs-game-over":{
            src: "/assets/sounds/08_VS_Game_Over.mp3",
            group: "bg"
        },
        "nes-game-lost":{
            src:"/assets/sounds/07_-_Dr._Mario_-_NES_-_Game_Over.ogg",
            group:"bg"
        },
        */
        "wii-title":{
            src: "/assets/sounds/bg/wii-02_Title.mp3",
            group: "bg"
        },
        "wii-select":{
            src: "/assets/sounds/bg/wii-03_Select.mp3",
            group: "bg"
        },
        "wii-fever":{
            src: "/assets/sounds/bg/wii-04_Fever.mp3",
            group: "bg"
        },
        "wii-chill":{
            src: "/assets/sounds/bg/wii-05_Chill.mp3",
            group: "bg"
        },
        "wii-cough":{
            src: "/assets/sounds/bg/wii-06_Cough.mp3",
            group: "bg"
        },
        "wii-sneeze":{
            src: "/assets/sounds/bg/wii-07_Sneeze.mp3",
            group: "bg"
        },
        "wii-clear": {
            src: "/assets/sounds/bg/wii-clear.mp3",
            group: "bg"
        }
    };

    function Sounds(key) {
        Sounds.play(key);
    }

    var debug = false;
    var muted = false;
    var volume = 1;

    function log(msg) {
        if(debug)
            console.log(msg);
    }
    Sounds.debug = function(state) {
        debug = typeof(state) == "undefined" ? true : state;
    };

    Sounds.mute = function() {
        log("muting");
        Sounds.stopAll();
        muted = true;
    };

    Sounds.unmute = function() {
        log("un-muting");
        muted = false;
    };

    Sounds.setVolume = function(v) {
        volume = v < 1 ? v : (v>100 ? 1 : v/100);
        log("setting volume to " + v);
        for(var key in elements) {
            for(var i=0; i<elements[key].audio.length; i++) {
                elements[key].audio[i].volume = volume;
            }
        }
    };

    Sounds.has = function(key) {
        return typeof(library[key]) !== "undefined";
    };

    function warmup_callback() {
        if(this.elem.currentTime > 0) {
            this.elem.removeEventListener("timeupdate", this.cb);
            log("Pausing after callback " + this.k + ":" + this.i);
            this.elem.pause();
            this.elem.currentTime = 0;
            this.elem.volume = volume;
            this.resolve();
        }
    }

    Sounds.warmup = function() {
        log("warming up");
        var promises = [];
        for(var k in elements) {
            for(var i=0;i<elements[k].audio.length; i++) {
                promises.push(new Promise(function(elem, resolve, reject){
                    var ctx = {
                        elem: elem,
                        resolve: resolve,
                        reject: reject,
                        cb: null,
                        k: k,
                        i: i
                    };
                    ctx.cb = warmup_callback.bind(ctx);
                    elem.addEventListener("timeupdate", ctx.cb);
                    elem.volume = 0.01; 
                    log("Playing element " + k + ":" + i);
                    elem.play().catch(function(k,i,err){
                        console.error(err);
                    }.bind(elem,k,i));
                }.bind(null, elements[k].audio[i])));
            }
        }
        return Promise.all(promises);
    };

    Sounds.play = function(key) {
        if(muted) {
            log("play of " + key + "inhibited, muted");
            return;
        }

        log("playing " + key);

        var idx = prepareToPlay(key);
        if(idx !== null) {  
            var elementKey = Sounds._getElementKey(key);
            try {
                elements[elementKey].audio[idx].currentTime = 0;
            } catch(e) {
                // needed to be used with firefox
            }
            try {
                log("Playing element " + elementKey + ":" + idx);
                elements[elementKey].audio[idx].play().catch(function(err){
                    log("Error while playing " + key + " (element " + elementKey + ":" + idx + ")");
                    if(menu)
                    menu.init.then(function(){
                        menu.set("require_click_to_play", true);
                    });
                });
            } catch(e) {}
        }
    };

    Sounds.resume = function(key) {
        if(muted) {
            log("resuming of " + key + "inhibited, muted");
            return;
        }

        log("resuming " + key);

        var idx = prepareToPlay(key);
        if(idx !== null) {  
            try {
                log("Playing element " + key + ":" + idx);
                elements[key].audio[idx].play().catch(function(err){
                    log("Error while playing " + key);
                    if(menu)
                    menu.init.then(function(){
                        menu.set("require_click_to_play", true);
                    });
                });
            }
            catch(e){
                // needed for firefox
            }
        }
    };

    function prepareToPlay(key) {
        if(elements !== null && typeof(library[key]) !== "undefined") {
            if(library[key].group) {
                var elementKey = Sounds._parseElementGroupName(library[key].group);
                elements[elementKey].audio[0].src = library[key].src;
                return 0;
            }
            else {   
                //if(library[key].async)
                //    Sounds._load(key);
                
                return get_idx_for(key);
            }
        }
        return null;
    }

    function get_idx_for(key) {
        if(typeof(library[key].srcs) !== "undefined") {
            var rnd = Math.random();
            for(var i=0;i<library[key].srcs.length; i++) {
                if(rnd < library[key].srcs[i][0]) {
                    return i;
                }
                else {
                    rnd -= library[key].srcs[i][0];
                }
            }
            return 0;
        }
        else {
            return 0;
        }
    }


    Sounds.stop = function(key) {
        if(elements === null) {
            log("Cannot stop " + key + ", elements not loaded");
            return;
        }
        log("Stopping " + key);
        if(typeof(elements[key]) === "undefined") {
            if(typeof(library[key]) !== "undefined" && typeof(library[key].group) !== "undefined") {
                key = Sounds._parseElementGroupName(library[key].group);
                if(typeof(elements[key]) === "undefined") {
                    return;
                }
            }
            else {
                return;
            }
        }

        for(var i=0;i<elements[key].audio.length;i++) {
            log("Pausing element " + key + ":" + i );
            elements[key].audio[i].pause();
        }
    };
    
    Sounds.stopAll = function() {
        log("stopAll");
        for(var k in elements)
            Sounds.stop(k);
    };

    Sounds.stopGroup = function(grp) {
        log("stopGroup " + grp);
        Sounds._parseElementGroupName(grp);
        Sounds.stop(Sounds._parseElementGroupName(grp));
    };

    Sounds._generateAudioFor = function(key, src) {
        var audio = new Audio(src);
        if(typeof(library[key].group) !== "undefined" && library[key].group == "bg") {
            audio.volume = volume;//*.5;
        }
        else {   
            audio.volume = volume;
        }

        //audio.currentTime = 0;
        
        return audio;
    };

    Sounds._getElementKey = function(key) {
        if(typeof(library[key].group) === "undefined")
            return key;
        else
            return Sounds._parseElementGroupName(library[key].group);
    };

    Sounds._parseElementGroupName = function(group) {
        return "--group--" + group;
    };

    Sounds._load = function(key) {
        var elementKey = Sounds._getElementKey(key);

        if(elements === null || elements[elementKey].audio.length)
            return;
        
        if(typeof(library[key].src) !== "undefined") {
            elements[elementKey].audio.push(Sounds._generateAudioFor(key, library[key].src));
        }
        else if(typeof(library[key].srcs) !== "undefined") {
            for(var j=0;j<library[key].srcs.length;j++) {
                elements[elementKey].audio.push(Sounds._generateAudioFor(key, library[key].srcs[j][1]));
            }
        }
    };

    Sounds.initialize = function() {
        
        if(elements !== null)
            return;
        
        elements = Sounds.elements = {};
        for(var k in library) {
            var elementKey = Sounds._getElementKey(k);
            if(typeof(elements[elementKey]) === "undefined")
                elements[elementKey] = {
                    audio: []
                };

            //if(typeof(library[k].async) === "undefined" || !library[k].async)
            Sounds._load(k);
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
    function TapController(parentElement, inputs, swaps) {
        var root = this._root = document.createElement("div");
        root.className = "tap-controller";
        root.addEventListener("touchstart", this._touchStart.bind(this));
        root.addEventListener("touchend", this._touchEnd.bind(this));

        this.swapZones(swaps);

        this._touches = {};
        this._inputs = inputs;

        document.getElementById("main").style.bottom = (Math.floor(window.innerHeight*.25)-20)+"px";

        parentElement.appendChild(root);
        this._root.addEventListener("mousedown", function(e){ e.preventDefault(); }, false);
    }

    /**
     * Reset Zones and swap those provided
     */
    TapController.prototype.swapZones = function(swaps) {
        var zones = TapController.defaultZones();
        this._zones = [];
        for(var fromLabel in swaps) {
            var from=-1, to=-1;
            for(var i=0;i<zones.length && (from == -1 || to == -1) ;i++) {
                switch(zones[i].label) {
                    case fromLabel: from=i; break;
                    case swaps[fromLabel]: to=i; break;
                }
            }

            if(from==-1 || to==-1) {
                console.error("Invalid Swap " + fromLabel + " <-> " + swaps[fromLabel]);
                continue;
            }

            //{keyCode:40, label:"DOWN",  zone:[  0, h75, w50,   h]},

            

            this._zones.push({
                keyCode:zones[from].keyCode,
                label:zones[from].label,
                zone:zones[to].zone
            });

            zones[to].handled = true;
        }

        for(var i=0;i<zones.length;i++)
            if(typeof(zones[i].handled) === "undefined" || !zones[i].handled)
                this._zones.push(zones[i]);

        // redraw if already on screen
        if(this._root.lastElementChild)
            this.display();
        
        return this;
    };

    TapController.prototype.display = function() {
        while(this._root.lastElementChild)
            this._root.removeChild(this._root.lastElementChild);


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

        console.log("[TOUCH] start");

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
                        console.log("[TAP] pressing "+this._zones[j].keyCode);
                        this._inputs.press(this._zones[j].keyCode);
                        break;
                    }
                }
            }
        }

        ev.preventDefault();
    };

    TapController.prototype._touchEnd = function(ev) {
        if(!this._inputs)
            return;

        console.log("[TOUCH] end");

        for(var i=0; i<ev.changedTouches.length;i++) {
            if(typeof(this._touches[ev.changedTouches[i].identifier]) !== "undefined") {
                this._inputs.release(this._touches[ev.changedTouches[i].identifier]);
                console.log("[TAP] releasing "+this._touches[ev.changedTouches[i].identifier]);
                delete this._touches[ev.changedTouches[i].identifier];
            }
        }

        ev.preventDefault();
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
        this._last_released = null;

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
            if (p2 >= 0 && p2 < this._size) {
                this._data[p2] = this._data[p2] & Board.CODES.colors.mask;
            }
        }

        this._data[p] = Board.CODES.forms.values.exploding.code | (this._data[p] & Board.CODES.colors.mask);
    };

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

        this._last_released = {
            a:{x:this._ownedPill.x,y:this._ownedPill.y},
            b:this._ownedPill.getBPos()
        };

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
                        //console.debug("Pushing Combos");
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
                    // play warnings
                    if(this._last_released) {
                        if(this._last_released.a.y <= 2 || this._last_released.b.y <= 2) {
                            // look if this pill is the only one above the line #3
                            var found = false;
                            var aStillThere = false;
                            var bStillThere = false;
                            for(var y=0;y<3;y++) {
                                for(var x=0; x<this._width; x++) {
                                    if(this._data[y*this._width+x] === 0x00)
                                        continue;

                                    if(x == this._last_released.b.x && y == this._last_released.b.y) {
                                        bStillThere = true;
                                        continue;
                                    }
  
                                    if(x == this._last_released.a.x && y==this._last_released.a.y) {
                                        aStillThere = true;
                                        continue;
                                    }
                                    
                                    found = true;
                                    break;
                                }
                            }
                            
                            if(!found && (aStillThere || bStillThere)) {
                                // play the warning sound
                                Sounds.play("warning")
                            }
                        }
                        
                        this._last_released = null;
                    }
                        
                    // process combos
                    if(this._stats.counting_combos.length) {
                        //console.debug("Assigning Combos");
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

    Board.prototype.setGameRules = function(game_rules) {
        this._game_rules = game_rules;
        if(typeof(this._game_rules) !== "object" || !this._game_rules)
            this._game_rules = {};

            if(typeof(this._game_rules.combos) === "undefined")
                this._game_rules.combos = "n/a";
    };

    Board.prototype._processExternalHandicap = function() {
        if(this._handicaps.length) {
            if(this._game_rules) {
                switch(this._game_rules.combos) {
                    case "coop-rr":
                        this._processExternalHandicap_coop();
                    break;
                    default:
                        this._processExternalHandicap_random();
                }
            }
            else {
                this._processExternalHandicap_random();
            }
            
            // clear handicaps, they were processed
            this._handicaps = [];

            // handicap were processed, preventing next pill deployment
            return false;
        }

        // done processing handicaps, allowing next pill to be dropped
        return true;
    };
    
    Board.prototype._processExternalHandicap_random = function() {
        var l = this._handicaps.length;
        var step = this._width/l;
        for(var i=0; i<l; i++) {
            var x = Math.floor(Math.random()*step) + i*step;
            this._data[x] = this._handicaps[i];
        }
    };

    Board.prototype._processExternalHandicap_coop = function() {
        var colors = this._getColumnsFirstColor();

        var noMatches = [];
        for(var i=0; i<this._handicaps.length; i++) {
            var matches = [];
            for(var x=0;x<this._width;x++) {
                if(colors[x] === null || colors[x] === 0x00)
                    continue;
                
                if(colors[x] == this._handicaps[i])
                    matches.push(x);
            }

            if(matches.length == 0) {
                // no color match, process this one at the end
                noMatches.push(i);
            }
            else {
                // randomize where to drop it
                var x = this._randomizeDrop(this._handicaps[i], matches);
                colors[x] = null;
            }
        }

        for(var i=0; i<noMatches.length; i++) {
            var available = [];
            for(var j=0;j<colors.length;j++)
                if(colors[j] !== null)
                    available.push(j);
            
            // no more free slot available
            if(available.length==0)
                break;

            // otherwise assign the drop
            var x = this._randomizeDrop(this._handicaps[noMatches[i]], available);
            colors[x] = null;
        }
    };

    Board.prototype._getColumnsFirstColor = function() {
        var colors = [];
        for(var x=0;x<this._width;x++) {
            colors[x] = 0x00;
            
            for(var y=0;y<this._height;y++) {
                var coord = this.coordToPos(x,y);
                if(this._data[coord] != 0x00) {
                    if(y == 0)
                    colors[x] = null;
                    else
                    colors[x] = this._data[coord] & Board.CODES.colors.mask;
                    break;
                }
            }
        }

        return colors;
    };

    Board.prototype._randomizeDrop = function(code, matches) {
        var i = Math.floor(Math.random()*matches.length);
        var x = matches[i];
        this._data[x] = code;
        return x;
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

    PillBottle.prototype.setGameRules = function(game_rules) {
        this._board.setGameRules(game_rules);
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
                if(typeof(this._control_used) == "string" && this._control_used.substr(0,3) == 'tap') {
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
                if(typeof(this._control_used) == "string" && this._control_used.substr(0,3) == 'tap') {
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
        this._gamerules = null;
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
        this._last_room_joined = room;
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
                if(opponent && roomDetails.clients[i].board) {
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
        
        delete roomDetails.clients;
        this.updateRoom(roomDetails);
        // override this since the room_uuid won't update until next tick
        this._gamerules = roomDetails.gameRules;

        if(roomDetails.gameInProgress) {
            // auto set ready & start my game
            this.readyToStart().then(function(){
                if(myFrame) {
                    this._game._mainPillBottle._board.playFrame(myFrame);
                    this._game._mainPillBottle.record();
                }
                else {
                    this._game.setForMultiPlayer(this._difficulty);
                    this._game.setGameRules(this._gamerules);
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
            this._name = menu.get("my_settings.multi_name");
            if(!this._name) {
                this._name = prompt("Please input your name:");
            }
            
            if(!this._name) {
                pickRandomName().then(function(name) {
                    this._name = name;
                    menu.set("my_settings.multi_name",this._name);
                    authenticate.call(this);
                }.bind(this));
            }
            else {
                menu.set("my_settings.multi_name",this._name);
                authenticate.call(this);
            }
        }.bind(this));
    };

    Multiplayer.prototype.on_reconnect = function() {
        authenticate.call(this).then(function(){
            // if we were in a room, try to rejoin
            if(this._last_room_joined) {
                this._socket.emit("join", {
                    room:this._last_room_joined,
                    board:encodeFrame(this._game._mainPillBottle._board.getNewFrame(true))
                });
            }
        }.bind(this));
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
                return null;
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

        // get game rules this._game._mainPillBottle._board
        this._game.setGameRules(this._gamerules);

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

        this.__reset = function() {
            this.resetGame();
            
            menu.set("playing", false);
            Sounds.play("wii-select");
            document.getElementById("overlay").removeEventListener("click", this.__reset);
            menu.set("info","");
            menu.set("game_stats", null);

            // re add player that are already ready
            var room_uuid = menu.get("room_uuid");
            var my_uuid = menu.get("uuid");
            if(room_uuid) {
                var players = menu.get("players");
                for(var i=0; i<players.length; i++) {
                    
                    if(players[i].uuid == my_uuid) {
                        players[i].ready = false;
                    }
                    // check if we are in the same game
                    else if(players[i].ready && players[i].room && players[i].room.uuid==room_uuid) {
                        addOpponent.call(this, players[i]);
                    }
                }
            }

            this.__reset = null;
        }.bind(this);

        menu.set("info","Waiting game stats...");

        setTimeout(function(){
            if(!this._received_stats) {
                menu.set("info",menu.get("info") + "<br/>Tap to skip");
                document.getElementById("overlay").addEventListener("click", this.__reset);
            }
        }.bind(this),1000);
    };

    Multiplayer.prototype.on_statsready = function(data) {
        // display stats
        this._received_stats = true;
        menu.set("game_stats", data.stats);
        menu.set("info","Tap to dismiss");
        document.getElementById("overlay").addEventListener("click", this.__reset);
    };

    Multiplayer.prototype.leave = function() {
        this._last_room_joined = null;
        this._socket.emit("leave", null, function(){
            menu.set("room_uuid",null);
            Sounds.play("wii-title");
        });
    };

    Multiplayer.prototype.on_room_created = function(data) {
        menu.push("rooms", data);
        //upsertRoom(data);
    };

    Multiplayer.prototype.updateRoom = function(room) {
        var found = false;
        menu.splice("rooms", function(elem) {
            if(elem.uuid == room.uuid) {
                found = true;
                for(var k in room)
                    if(k != "uuid")
                        elem[k] = room[k];
            }
            return false;
        }).then(function(){
            if(!found)
                menu.push("rooms", room);
        });

        if(room.uuid == menu.get("room_uuid")) {
            this._gamerules = room.gameRules;
        }
    }

    Multiplayer.prototype.on_room_updated = function(data) {
        this.updateRoom(data);
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
            this.updateRoom(details.room);
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
        this._received_stats = false;
        menu.set("opponents", this._opponents);
        menu.set("is_ready", false);
    };

    Multiplayer.prototype.invite = function(player_id) {
        this._socket.emit("invite", {
            players: [ player_id ]
        });
    };

    Multiplayer.prototype.tick = function(tick) {
        if(this._game._game_stats && this._game._game_stats.combos && this._game._game_stats.combos.length > 1) {
            this._socket.emit("combos", encodeFrame(this._game._game_stats.combos));
        }
    };

    function authenticate() {
        return new Promise(function(resolve, reject){
            this._socket.emit("authenticate",{
                uuid: uuid,
                name: this._name,
                meta: btoa(JSON.stringify({
                    fps: this._game._fps
                }))
            }, resolve);
        }.bind(this));
    }

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

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
        // Windows Phone must come first because its UA also contains "Android"
      if (/windows phone/i.test(userAgent)) {
          return "Windows Phone";
      }
  
      if (/android/i.test(userAgent)) {
          return "Android";
      }
  
      // iOS detection from: http://stackoverflow.com/a/9039885/177710
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
          return "iOS";
      }
  
      return "unknown";
  }

menu.contentloaded = new Promise(function(resolve, reject){
    app.factory("contentLoaded",function(){
        return {
            resolve: resolve,
            reject: reject
        };
    });
});

menu.init = new Promise(function(resolve, reject){
    app.factory("menuInitialized",function(){
        return {
            resolve: resolve,
            reject: reject
        };
    });

    app.factory("pref", function(){
        return function(scope, name, defaultValue, format, onChange) {
            var scope_name = typeof(name) === "string" ? name : name[0];
            var pref_key = typeof(name) === "string" ? name : name[1];

            var v = preference(pref_key, defaultValue);
            if(typeof(format) === "function")
                v = format(v);
            
            var parts = scope_name.split(".");
            var parent = scope;
            for(var i=0; i<parts.length-1;i++) {
                if(typeof(parent[parts[i]]) === "undefined")
                    parent[parts[i]] = {};
                parent = parent[parts[i]];
            }

            parent[parts[parts.length-1]] = v;
            
            scope.$watch(scope_name,function(newValue,oldValue){
                if(oldValue != newValue) {
                    preference.set(pref_key, typeof(newValue) === "object" && newValue ? JSON.stringify(newValue): newValue);
                }
                if(typeof(onChange)==="function")
                    onChange.apply(this, arguments);
            });
        };
    });

    app.controller("MenuController",["$scope", "$timeout", "pref", "menuInitialized", "contentLoaded", MenuController]);
});

function MenuController($scope, $timeout, pref, menuInitialized, contentLoaded){
    $scope.uuid = null;
    $scope.my_settings = {};

    pref($scope,["my_settings.difficulty","difficulty"], 4, parseInt, function(newValue, oldValue){
        multiplayer.setDifficulty(newValue)
    });
    pref($scope,["my_settings.sensitivity","sensitivity"], 16, parseInt, function(newValue, oldValue){
        game.touch_sensitivity = newValue;
    });
    
    var defaultControl = "arrows";
    switch(getMobileOperatingSystem()) {
        case "Android": case "iOS":
            defaultControl = "tap";
            break;
    }

    pref($scope,["my_settings.controls","controls"], defaultControl, null, function(newValue, oldValue){
        inputs.clearAll();
        inputs.loadKeyMap($scope.keyMap[newValue].map);
    });
    pref($scope,"soundtrack", "random", null, function(newValue, oldValue) {
        if(newValue != oldValue && newValue != "random" && newValue != "none") {
            Sounds.play(newValue);
        }
    });
    pref($scope,["my_settings.volume", "volume"], 1, parseInt, function(newValue, oldValue) {
        Sounds.setVolume(newValue);
    });
    pref($scope,"game_rules.combos", "normal-rr", null, function(newValue, oldValue) {
        if(newValue != oldValue && $scope.hosting) {
            $timeout(function(){
                multiplayer.setGameRule($scope.game_rules);
            },0);
        }
    });
    pref($scope,["my_settings.multi_name","multi_name"], preference("multi-name",""));
    pref($scope,["my_settings.enable_sound","enable_sound"], "yes", null, function(newValue, oldValue){
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
        var parts = name.split(".");
        var e = $scope;
        for(var i=0;i < parts.length;i++)
            e = e[parts[i]];
        return e;
    };

    menu.set = function(name,value) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                var parts = name.split(".");
                var e = $scope;
                while(parts.length > 1) {
                    var k = parts.shift();
                    if(typeof(e[k]) === "undefined")
                        e[k] = {};

                    e = e[k];
                }

                e[parts[0]] = value;
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

    $scope.incrementDifficulty = function() {
        if(++$scope.my_settings.difficulty > 20) {
            $scope.my_settings.difficulty = 20;
        }
    };

    $scope.decrementDifficulty = function() {
        if(--$scope.my_settings.difficulty < 1) {
            $scope.my_settings.difficulty = 1;
        }
    };


    $scope.contentLoaded = function() {
        contentLoaded.resolve();
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
        Sounds.warmup().then(function(){
            Sounds.play("wii-title");
        });
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

    $scope.showStats = function(state) {
        $scope.stats = state === false ? state : true;
    };

    $scope.pillefficacy = function(player) {
        // a copy exists in the ng-stats.js file
        return Math.floor( (player.viruskilled*3) / (player.pillcount*2) * 1000 ) / 10;
    };

    $scope.pillwasted = function(player) {
        return Math.floor( player.endclutter / (player.pillcount*2) * 1000) / 10;
    };

    $scope.formatTime = function(ms) {
        var r = "";
        var s = Math.floor(ms/1000);
        if(s > 60) {
            var m = Math.floor(s/60);
            s -= 60*m;
            r += m+"m ";
        }
        r += s+"s";
        return r;
    };

    $scope.host = function() {
        if($scope.hosting)
            return;
        
        $scope.hosting = true;
        multiplayer.join($scope.my_settings.multi_name + "'s Game");
    };

    $scope.join = function(room) {
        $scope.hosting = false;
        $scope.room_uuid = null;
        
        $scope.is_ready = false;
        $scope.chats = [];

        game.setSoundTrack(getSoundTrack($scope.soundtrack));
        multiplayer.join(room.name);
    };

    $scope.ready = function() {
        if($scope.is_ready)
            return;

        multiplayer.readyToStart(parseInt($scope.my_settings.difficulty));
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
            game.startSinglePlayer(parseInt($scope.my_settings.difficulty));
            game.run();
        },0);
    };

    $scope.orderMyRoomFirst = function(item) {
        return item.uuid == $scope.room_uuid ? "" : item.name;
    };

    $scope.leaveRoom = function() {
        multiplayer.leave();
        $scope.hosting = false;
    };

    $scope.preview_tap_controls = function() {
        var swaps = menu.get("keyMap." + menu.get("my_settings.controls") + ".tapSwap");

        var tap = new TapController(document.getElementsByTagName("body")[0], null, swaps);
        tap.display();
        tap._root.addEventListener("click", function(){
            tap.destroy();
        });
    };

    var tapMap = {
        40: "DOWN",
        38: "UP",
        37: "LEFT",
        39: "RIGHT",
        88: "ROTATE_CLOCKWISE",
        90: "ROTATE_COUNTER_CLOCKWISE",
        19: "PAUSE",
        27: "ESC"
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
            map: tapMap
        },
        tap: {
            label: "Tap",
            map: tapMap
        },
        "tap-joel": {
            label: "Tap - Jo??l",
            map: tapMap,
            tapSwap: {
                DOWN: "B",
                SINK: "A",
                A: "SINK",
                B: "DOWN"
            }
        },
        wasd: {
            label: "WASD + ??? ???",
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
        },
        "coop-rr": {
            "label": "Cooperative Round Robin",
            "description": "to each opponent, one at a time, but will try to drop it on the right colors"
        }
    };

    $scope.soundtracks = [
        { value:"none", label:"None"},
        { value:"random", label:"Random"},
        { value:"wii-fever", label:"Wii Fever"},
        { value:"wii-chill", label:"Wii Chill"},
        { value:"wii-cough", label:"Wii Cough"},
        { value:"wii-sneeze", label:"Wii Sneeze"}
    ];

    menuInitialized.resolve();

    function getSoundTrack(soundtrack) {
        if(soundtrack === "random") {
            var count = $scope.soundtracks.length-2;
            var idx = Math.floor(Math.random()*count);
            for(var i=0;i<$scope.soundtracks.length;i++) {
                if($scope.soundtracks[i].value == "none" || $scope.soundtracks[i].value == "random") {
                    continue;
                }
                else if(--idx<=0) {
                    return $scope.soundtracks[i].value;
                }
            }
        }
        else if(soundtrack === "none") {
            return null
        }
    
        return soundtrack;
    }
}


global[ns] = menu;
return;

})(this, "menu");
(function (){
    "use strict";
function StatsController($scope, $timeout, $http) {

    $scope.formatPlayers = function(stats) {
        return stats.map(function(stat){return stat.player.name;}).join(", ")
    };


    $scope.winrate = function(player) {
        return Math.floor( player.totalgamewon / player.totalgameplayed * 1000 ) / 10;
    };

    $scope.pillefficacy = function(player) {
        // a copy exists in the ng-menu.js file
        return Math.floor( (player.totalviruskilled*3) / (player.totalpillused*2) * 1000 ) / 10;
    };

    $scope.avgendclutter = function(player) {
        return Math.floor(player.avgendclutter)/2;
    };

    $scope.$replays = new Paginator(function(params) {
        var p = $http.get("/stats/replays", { params: params });
        p.then(function(res){
            $scope.replays = res.data.replays;    
        });
        return p;
    });

    $scope.$players = new Paginator(function(params) {
        var p = $http.get("/stats/players", { params: params });
        p.then(function(res){
            $scope.players = res.data.players;
        });
        return p;
    });


    //$scope.$replays.loadPage(1);
    $scope.$players.loadPage(1);
}

function Paginator(http) {
    this.page = 0;
    this.lastpage = 0;
    
    this._http = http;
}

Paginator.PAGE_DISPLAYED = 5;

Paginator.prototype.loadPage = function(p) {
    if(p == this.page) {
        return;
    }
    this._http({
        page: p
    }).then(function(res){
        this.page = res.data.page;
        this.lastpage = res.data.lastpage;
        this.count = res.data.total;
    }.bind(this));
};

Paginator.prototype.pages = function() {
    var pages = [];
    if(this.page) {
        pages.push(1);
        var offset = this.page - Math.floor(Paginator.PAGE_DISPLAYED/2);
        for(var i=0; i<Paginator.PAGE_DISPLAYED; i++) {
            var p = i + offset;
            if(p>1 && p<this.lastpage) {
                pages.push(p);
            }
        }
        pages.push(this.lastpage);
    }
    return pages;
};

angular.module("app").controller("StatsController",["$scope", "$timeout", "$http", StatsController]);
    
})();

(function(){

    function sendToSW(msg) {
        if(navigator.serviceWorker.controller === null) {
            // delay it
            var ctx = typeof(this.tries) === "undefined" ? { tries: 0 } : this;
            if(++ctx.tries >= 10) {
                console.error("aborting sending message to service worker:" + msg);
                return;
            }

            setTimeout(sendToSW.bind(ctx,msg),500);
        }
        else {
            navigator.serviceWorker.controller.postMessage(msg);
        }
    }

    if("serviceWorker" in navigator && typeof(serviceWorkerUrl) !== "undefined" && serviceWorkerUrl) {
        window.addEventListener("load", function() {
            navigator.serviceWorker.register(serviceWorkerUrl)
            .then(function(registration) {
                return navigator.serviceWorker.ready
            }).then(function(){
                sendToSW({event:"getversion"});
                
                // Registration was successful
                menu.set("cache_status","ready");
                setTimeout(function(){
                    menu.set("cache_status","");
                },1000);
            }, function(err) {
                // registration failed :(
                menu.set("cache_status","error");
                menu.set("cache_status_error",err);
            });
        });

        navigator.serviceWorker.addEventListener("message", function(ev){
            if(typeof(ev.data) == "object" && typeof(ev.data.event) !== "undefined") {
                switch(ev.data.event) {
                    case "version":
                        menu.set("app_version", ev.data.data.version);
                        break;

                    case "updating":
                        menu.set("cache_status","updating");
                        break;
                    case "update_progress":
                        menu.set("cache_status","progress");
                        menu.set("cache_status_progress",{
                            total: ev.data.data.total,
                            loaded: ev.data.data.total.done
                        });
                        break;
                    case "updated":
                        window.location.reload();
                        break;
                }
            }
        });
        
    }
})();
"use strict";
//Sounds.debug();
Sounds.initialize();
var inputs = new Inputs().bindKeys();
var game = new DrMario();
var multiplayer = new Multiplayer(game);

game.registerInputs(inputs);
game.registerForTick(inputs.tick.bind(inputs));
game.registerForTick(multiplayer.tick.bind(multiplayer));
    
menu.contentloaded.then(function(){
    game.initUI(document.getElementById("main"));

    // var ws = new WebSocket(window.location.origin.replace(/^http/,"ws") + "/ws");
    var debug = window.debug = new Debug(document.getElementById("main"));
    game.registerForTick(debug.tick.bind(debug));

    
    if(menu.get("enable_audio") === "yes")
        Sounds.play("wii-title");
});
    