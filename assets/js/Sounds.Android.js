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