"use strict";

// var ws = new WebSocket(window.location.origin.replace(/^http/,"ws") + "/ws");
window.debug = new Debug(document.getElementById("main"));

var inputs = new Inputs().bindKeys();

var game = new DrMario({ root: document.getElementById("main") });
var multiplayer = new Multiplayer(game);

game.registerInputs(inputs);
game.registerForTick(inputs.tick.bind(inputs));
game.registerForTick(debug.tick.bind(debug));

Controller(document.getElementById("main"), inputs);

inputs.loadKeyMap({
    // ARROWS
    /*
    40: "DOWN",
    38: "UP",
    37: "LEFT",
    39: "RIGHT",
    88: "ROTATE_CLOCKWISE",
    90: "ROTATE_COUNTER_CLOCKWISE",
    */

    // WASD
    83: "DOWN",
    87: "UP",
    65: "LEFT",
    68: "RIGHT",
    37: "ROTATE_CLOCKWISE",
    39: "ROTATE_COUNTER_CLOCKWISE",

    // Other
    19: "PAUSE",
});

/*
var mirror = new PillBottle({root:document.getElementById("opponents")});
game._mainPillBottle.streamTo(mirror.generateStreamHandler());
*/
menu(game, multiplayer);

//game.startSinglePlayer(1);
//game.run();