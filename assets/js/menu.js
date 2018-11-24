(function (global, ns){
    "use strict";
    
    var settings = {};
    var menuRootObj = null;

    var keyMap = {
        arrows: {
            40: "DOWN",
            38: "UP",
            37: "LEFT",
            39: "RIGHT",
            88: "ROTATE_CLOCKWISE",
            90: "ROTATE_COUNTER_CLOCKWISE",
            19: "PAUSE",
        },
        wasd: {
            83: "DOWN",
            87: "UP",
            65: "LEFT",
            68: "RIGHT",
            37: "ROTATE_CLOCKWISE",
            39: "ROTATE_COUNTER_CLOCKWISE",
            19: "PAUSE",
        }
    };

    var current_inputs;

    function menu(game, multiplayer, inputs) {
        // initialize the menu
        menuRootObj = document.getElementById("menu");
        
        // add value change listener
        menuRootObj.addEventListener("input", function(ev) {
            if(ev.target.name) {
                updateValueFor(ev.target.name, ev.target.value, false);
            }
        });

        // control change
        current_inputs = inputs;
        if(inputs && settings.keymap)
            inputs.loadKeyMap(keyMap[setting.keymap]);


        // Handle the start button
        var start_single = document.getElementById("start-single");
        start_single.addEventListener("click", function(){
            game.setSoundTrack(getSoundTrack());
            setTimeout(function(){
                game.startSinglePlayer(parseInt(settings.difficulty));
                game.run();
            },0);
            menuRootObj.style.display = "none";
        });
        start_single.focus();

        
        // create a new room
        /*
        document.getElementById("multi-create-room").addEventListener("click", function(){
            if(typeof(settings["multi-new-room"]) !== "undefined" && settings["multi-new-room"]) {
                multiplayer.join(settings["multi-new-room"]);
            }
        });
        */

        // join multiplayer room
        document.getElementById("multi-rooms").addEventListener("click", function(ev) {
            if(ev.target.tagName == "BUTTON" && /room-join-btn/.test(ev.target.className)) {
                var tr = parentUntil(ev.target, function(e){return e.tagName=="TR";});
                var roomName = tr.getAttribute("room-name");
                multiplayer.join(roomName);
                ev.target.disabled = true;
            }
        });

        // players actions
        document.getElementById("players").addEventListener("click", function(ev) {
            if(ev.target.tagName == "BUTTON") {
                var tr = parentUntil(ev.target, function(e){return e.tagName=="TR";});
                var playeruuid = tr.getAttribute("player-uuid");
                // invite
                if(/player-invite/.test(ev.target.className)) {
                    multiplayer.invite(playeruuid);
                    ev.target.style.display = "none";
                }

                else if(/player-join/.test(ev.target.className)) {
                    multiplayer.joinPlayer(playeruuid);
                    ev.target.style.display = "none";
                }

                else if(/player-spectate/.test(ev.target.className)) {
                    multiplayer.spectate(playeruuid);
                    ev.target.style.display = "none";
                }
            }
        });

        function getSoundTrack() {
            if(settings.soundtrack === "random") {
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
            else if(settings.soundtrack === "none") {
                return null
            }

            return settings.soundtrack;
        }

        // start multi player
        document.getElementById("start-multi").addEventListener("click", function(){
            game.setSoundTrack(getSoundTrack());

            multiplayer.readyToStart(settings.difficulty).then(function(){
                menuRootObj.style.display = "none";
                this.disabled = false;
            }.bind(this));
            this.disabled = true;
        });

        
        // register game ending callback
        game.onGameOver(function(win) {
            menuRootObj.style.display = "block";
        });
    
        // initialize the current option values
        var menu_inputs = document.querySelectorAll("#menu [name]");
        for(var i=0;i<menu_inputs.length;i++) {
            
            var v = preference(menu_inputs[i].name, null);
            if(v)
                menu_inputs[i].value = v;
            
            updateValueFor(menu_inputs[i].name, menu_inputs[i].value, true);
        }
    }

    /**
     * Update the value on every field marked to update it, and save
     * it in the internal settings map
     * 
     * @param {string} name Name of the setting to be changed
     * @param {mixed} value New value to change it to
     */
    function updateValueFor(name, value, initial) {
        settings[name] = value;
        var labels = document.querySelectorAll("#menu [value-of='" + name + "']");
        for(var i = 0; i<labels.length; i++)
            labels[i].innerText = value;
        
        switch(name) {
            case "keymap":
                if(current_inputs) {
                    current_inputs.clearAll();
                    current_inputs.loadKeyMap(keyMap[value]);
                }
                break;
            
            case "sensitivity":
                game.touch_sensitivity = value;
                break;

            case "soundtrack":
                if(value != "random" && value != "none") {
                    if(!initial)
                        Sounds.play(value);
                }
                break;
        }

        preference.set(name, value);
    }

    function parentUntil(elem,test) {
        while(!test(elem))
            elem = elem.parentElement;
        
        return elem;
    }

    global[ns] = menu;
})(this, "menu");