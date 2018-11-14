"use strict";

// var ws = new WebSocket(window.location.origin.replace(/^http/,"ws") + "/ws");

var inputs = new Inputs().bindKeys();

var game = new DrMario({ root: document.getElementById("main") });
game.registerInputs(inputs);
game.registerForTick(inputs.tick.bind(inputs));

Controller(document.getElementById("main"), inputs);

inputs.loadKeyMap({
    40: "DOWN",
    38: "UP",
    37: "LEFT",
    39: "RIGHT",
    88: "ROTATE_CLOCKWISE",
    90: "ROTATE_COUNTER_CLOCKWISE",
    19: "PAUSE",
});

game.startSinglePlayer(1);

game.run();