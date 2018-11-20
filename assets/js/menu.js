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
                updateValueFor(ev.target.name, ev.target.value)
            }
        });

        // control change
        current_inputs = inputs;
        if(inputs && settings.keymap)
            inputs.loadKeyMap(keyMap[setting.keymap]);


        // Handle the start button
        var start_single = document.getElementById("start-single");
        start_single.addEventListener("click", function(){
            game.startSinglePlayer(parseInt(settings.difficulty));
            game.run();
            menuRootObj.style.display = "none";
        });
        start_single.focus();

        
        // create a new room
        document.getElementById("multi-create-room").addEventListener("click", function(){
            if(typeof(settings["multi-new-room"]) !== "undefined" && settings["multi-new-room"]) {
                multiplayer.join(settings["multi-new-room"]);
            }
        });

        // join multiplayer room
        document.getElementById("multi-rooms").addEventListener("click", function(ev) {
            if(ev.target.tagName == "BUTTON" && /room-join-btn/.test(ev.target.className)) {
                var tr = parentUntil(ev.target, function(e){return e.tagName=="TR";});
                var roomName = tr.getAttribute("room-name");
                multiplayer.join(roomName);
            }
        });

        // start multi player
        document.getElementById("start-multi").addEventListener("click", function(){
            multiplayer.readyToStart(settings.difficulty).then(function(){
                menuRootObj.style.display = "none";
            });
        });

        
        // register game ending callback
        game.onGameOver(function(win) {
            menuRootObj.style.display = "block";
        });
    
        // initialize the current option values
        var menu_inputs = document.querySelectorAll("#menu [name]");
        for(var i=0;i<menu_inputs.length;i++) {
            updateValueFor(menu_inputs[i].name, menu_inputs[i].value);
        }
    }

    /**
     * Update the value on every field marked to update it, and save
     * it in the internal settings map
     * 
     * @param {string} name Name of the setting to be changed
     * @param {mixed} value New value to change it to
     */
    function updateValueFor(name, value) {
        settings[name] = value;
        var labels = document.querySelectorAll("#menu [value-of='" + name + "']");
        for(var i = 0; i<labels.length; i++)
            labels[i].innerText = value;
        
        switch(name) {
            case "keymap":
                if(current_inputs)
                    current_inputs.loadKeyMap(keyMap[value]);
                break;
        }
    }

    function parentUntil(elem,test) {
        while(!test(elem))
            elem = elem.parentElement;
        
        return elem;
    }

    global[ns] = menu;
})(this, "menu");
