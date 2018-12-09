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