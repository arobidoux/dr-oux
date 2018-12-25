"use strict";
Sounds.debug();
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
    