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
Sounds.play("wii-title");
