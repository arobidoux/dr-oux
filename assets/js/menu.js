(function (global, ns){
    "use strict";
    
    var settings = {};
    var menuRootObj = null;

    function menu(game, multiplayer) {
        // initialize the menu
        menuRootObj = document.getElementById("menu");
        
        // add value change listener
        menuRootObj.addEventListener("input", function(ev) {
            if(ev.target.name) {
                updateValueFor(ev.target.name, ev.target.value)
            }
        });

        // Handle the start button
        var start_single = document.getElementById("start-single");
        start_single.addEventListener("click", function(){
            game.startSinglePlayer(parseInt(settings.difficulty));
            game.run();
            menuRootObj.style.display = "none";
        });
        start_single.focus();

        document.getElementById("start-multi").addEventListener("click", function(){
            multiplayer.readyToStart();
            menuRootObj.style.display = "none";
        });

        // monkey patch for now
        game.victory = monkeyPatchVictory;
        game.defeat = monkeyPatchDefeat;

        // initialize the current option values
        var menu_inputs = document.querySelectorAll("#menu [name]");
        for(var i=0;i<menu_inputs.length;i++) {
            updateValueFor(menu_inputs[i].name, menu_inputs[i].value);
        }
    }

    function monkeyPatchVictory() {
        menuRootObj.style.display = "block";
        DrMario.prototype.victory.apply(this, arguments);
    }

    function monkeyPatchDefeat() {
        menuRootObj.style.display = "block";
        DrMario.prototype.defeat.apply(this, arguments);
    };

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
    }

    global[ns] = menu;
})(this, "menu");
