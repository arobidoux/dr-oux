(function (global, ns){
    "use strict";

    var elements = null;
    var library = {
        "combo1": {
            src: "/assets/sounds/effects/combo-1.wav"
        },
        "combo2": {
            src: "/assets/sounds/effects/combo-2.wav"
        },
        "pause": {
            src: "/assets/sounds/effects/pause.wav"
        },
        "destroy": {
            srcs: [
                [.5,"/assets/sounds/effects/pill-destroy-1.wav"],
                [.5,"/assets/sounds/effects/pill-destroy-2.wav"]
            ]
        },
        "fall": {
            src: "/assets/sounds/effects/pill-fall.wav",
            inst: 8
        },
        "move": {
            src: "/assets/sounds/effects/pill-move.wav",
            inst: 8
        },
        "rotate": {
            src: "/assets/sounds/effects/pill-rotate.wav",
            inst: 8
        },

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
            async: true,
            group: "bg"
        },
        "wii-title":{
            src: "/assets/sounds/wii-02_Title.mp3",
            async: true,
            group: "bg"
        },
        "wii-select":{
            src: "/assets/sounds/wii-03_Select.mp3",
            async: true,
            group: "bg"
        },
        "wii-fever":{
            src: "/assets/sounds/wii-04_Fever.mp3",
            async: true,
            group: "bg"
        },
        "wii-chill":{
            src: "/assets/sounds/wii-05_Chill.mp3",
            async: true,
            group: "bg"
        },
        "wii-cough":{
            src: "/assets/sounds/wii-06_Cough.mp3",
            async: true,
            group: "bg"
        },
        "wii-sneeze":{
            src: "/assets/sounds/wii-07_Sneeze.mp3",
            async: true,
            group: "bg"
        },
        "wii-clear": {
            src: "/assets/sounds/wii-clear.mp3",
            async: true,
            group: "bg"
        }
    };

    function Sounds(key) {
        Sounds.play(key);
    }

    Sounds.has = function(key) {
        return typeof(library[key]) !== "undefined";
    };

    Sounds.play = function(key) {
        if(typeof(library[key]) !== "undefined") {
            if(library[key].group)
                Sounds.stopGroup(library[key].group);
            
            if(library[key].async)
                Sounds._load(key);

            var idx = get_idx_for(key);
            
            elements[key].audio[idx].play().catch(function(err) {
                console.log("Sound error: " + err);
            });
        }
    };

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
            var l = elements[key].audio.length;
            return l==1 ? 0:elements[key].cur++ % l;
        }
    }


    Sounds.stop = function(key) {
        for(var i=0;i<elements[key].audio.length;i++)
            elements[key].audio[i].pause();
    };

    Sounds.stopGroup = function(grp) {
        for( var k in library )
            if(typeof(library[k].group) !== "undefined" && library[k].group == grp)
                Sounds.stop(k);
    };

    Sounds._generateAudioFor = function(key, src) {
        var audio = new Audio(src);
        if(typeof(library[key].group) !== "undefined" && library[key].group == "bg")
            audio.volume = .5;
        return audio;
    };

    Sounds._load = function(key) {
        if(elements[key].audio.length)
            return;

        for(var i=0, l=library[key].inst||1;i<l;i++) {
            if(typeof(library[key].src) !== "undefined") {
                elements[key].audio.push(Sounds._generateAudioFor(key,library[key].src));
            }
            else if(typeof(library[key].srcs) !== "undefined") {
                for(var j=0;j<library[key].srcs.length;j++) {
                    elements[key].audio.push(Sounds._generateAudioFor(key, library[key].srcs[j][1]));
                }
            }
        }
    };

    Sounds.initialize = function() {
        
        if(elements !== null)
            return;
        
        elements = {};
        for(var k in library) {
            elements[k] = {
                audio: [],
                cur:0
            };

            if(typeof(library[k].async) === "undefined" || !library[k].async)
                Sounds._load(k);
        }
    };

    global[ns] = Sounds;
})(this, "Sounds");