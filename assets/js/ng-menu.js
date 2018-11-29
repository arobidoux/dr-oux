(function (global, ns){
    "use strict";

var menu = {};
var app = angular.module("app",[]);

menu.init = new Promise(function(resolve, reject){
    app.factory("menuInitialized",function(){
        return {
            resolve: resolve,
            reject: reject
        };
    });

    app.factory("pref", function(){
        return function(scope, name, defaultValue, format, onChange) {
            var v = preference(name, defaultValue);
            if(typeof(format) === "function")
                v = format(v);
            
            var parts = name.split(".");
            var parent = scope;
            for(var i=0; i<parts.length-1;i++) {
                if(typeof(parent[parts[i]]) === "undefined")
                    parent[parts[i]] = {};
                parent = parent[parts[i]];
            }

            parent[parts[parts.length-1]] = v;
            
            scope.$watch(name,function(newValue,oldValue){
                if(oldValue != newValue) {
                    preference.set(name, typeof(newValue) === "object" && newValue ? JSON.stringify(newValue): newValue);
                }
                if(typeof(onChange)==="function")
                    onChange.apply(this, arguments);
            });
        };
    });

    app.controller("MenuController",["$scope", "$timeout", "pref", "menuInitialized", MenuController]);
});



function MenuController($scope, $timeout, pref, menuInitialized){

    $scope.settings = {};
    $scope.uuid = null;

    pref($scope,"difficulty", 4, parseInt);
    pref($scope,"sensitivity", 16, parseInt, function(newValue, oldValue){
        game.touch_sensitivity = newValue;
    });
    pref($scope,"controls", "arrows", null, function(newValue, oldValue){
        inputs.clearAll();
        inputs.loadKeyMap($scope.keyMap[newValue].map);
    });
    pref($scope,"soundtrack", "random", null, function(newValue, oldValue) {
        if(newValue != oldValue && newValue != "random" && newValue != "none") {
            Sounds.play(newValue);
        }
    });
    pref($scope,"game_rules.combos", "normal-rr", null, function(newValue, oldValue) {
        if(newValue != oldValue && $scope.hosting) {
            $timeout(function(){
                multiplayer.setGameRule($scope.game_rules);
            },0);
        }
    });
    pref($scope,"multi_name", preference("multi-name",""));
    pref($scope, "enable_sound", "yes", null, function(newValue, oldValue){
        if(newValue=="yes") {
            Sounds.unmute();
            if($scope.room_uuid)
                Sounds.play("wii-select");
            else
                Sounds.play("wii-title");
        }
        else {
            Sounds.mute();
        }
    });

    $scope.players = [];
    $scope.rooms = [];
    $scope.invitations = [];
    $scope.hosting = null;
    $scope.room_uuid = null;
    $scope.playing = false;
    $scope.chats = [];

    menu.get = function(name) {
        return $scope[name];
    };

    menu.set = function(name,value) {
        $timeout(function(){
            $scope[name] = value;
        });
    };

    menu.push = function(name, value) {
        $timeout(function(){
            $scope[name].push(value);
        });
    };
    
    menu.splice = function(name, filter, ...replaceWith) {
        $timeout(function(){
            if(typeof(filter) === "function") {
                for(var i=0;i<$scope[name].length;i++) {
                    if(filter($scope[name][i])) {
                        $scope[name].splice(i,1, ...replaceWith);
                    }
                }
            }
            else {
                throw new Error("Invalid splice filter argument");
            }
        });
    };

    menu.alter = function(name, alter) {
        $timeout(function(){
            for(var i=0;i<$scope[name].length;i++) {
                alter($scope[name][i]);
            }
        });
    };


    $scope.invite = function(player) {
        player.invited=true;
        multiplayer.invite(player.uuid);
    };

    $scope.kick = function(player) {
        multiplayer.kick(player.uuid);
    };

    $scope.backToHome = function() {
        game.abort();
        $scope.playing = false;
        Sounds.play("wii-title");
    };

    $scope.acceptInvitation = function(invitation) {
        $scope.join(invitation.room);
        for(var i=0;i<$scope.invitations.length;i++) {
            if($scope.invitations[i] == invitation)    
                $scope.invitations.splice(i,1);
                break;
        }
    };

    $scope.host = function() {
        if($scope.hosting)
            return;
        
        $scope.hosting = true;
        multiplayer.join($scope.multi_name + "'s Game");
    };

    $scope.join = function(room) {
        $scope.hosting = false;
        $scope.room_uuid = null;
        
        $scope.is_ready = false;
        $scope.chats = [];

        multiplayer.join(room.name);
    };

    $scope.ready = function() {
        if($scope.is_ready)
            return;

        game.setSoundTrack(getSoundTrack($scope.soundtrack));
        multiplayer.readyToStart(parseInt($scope.difficulty));
        $scope.is_ready = true;
    };

    $scope.submitChat = function(msg) {
        if(msg)
            multiplayer.chat(msg);
    };

    $scope.startSingle = function() {
        game.setSoundTrack(getSoundTrack($scope.soundtrack));
        $timeout(function(){
            game.startSinglePlayer(parseInt($scope.difficulty));
            game.run();
        },0);
    };

    $scope.orderMyRoomFirst = function(item) {
        return item.uuid == $scope.room_uuid ? "" : item.name;
    };

    $scope.keyMap = {
        arrows: {
            label: "Arrows + X-Z",
            map: {
                40: "DOWN",
                38: "UP",
                37: "LEFT",
                39: "RIGHT",
                88: "ROTATE_CLOCKWISE",
                90: "ROTATE_COUNTER_CLOCKWISE",
                19: "PAUSE",
            }
        },
        wasd: {
            label: "WASD + ← →",
            map: {
                83: "DOWN",
                87: "UP",
                65: "LEFT",
                68: "RIGHT",
                37: "ROTATE_CLOCKWISE",
                39: "ROTATE_COUNTER_CLOCKWISE",
                19: "PAUSE",
            }
        }
    };

    $scope.gameRules = {
        "normal-rr": {
            "label": "Normal Round Robin",
            "description": "Send to each opponent, one at the time"

        },
        "roundrobin": {
            "label": "Round Robin",
            "description": "Every combos will send to the next player (potentially sending it to the sender)"
        },
        "none": {
            "label": "None",
            "description": "Nothing will be sent..."
        },
        "multiplier": {
            "label": "Multiplier",
            "description": "Always send to every opponents"
        },
        "punitive": {
            "label": "Punitive",
            "description": "Return to Sender, always send to the player who played the combo"
        }
    };

    menuInitialized.resolve();
}

function getSoundTrack(soundtrack) {
    if(soundtrack === "random") {
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
    else if(soundtrack === "none") {
        return null
    }

    return soundtrack;
}

global[ns] = menu;
return;



function menu(game, multiplayer, inputs) {
    return;
    // initialize the menu


    // control change
    current_inputs = inputs;
    if(inputs && settings.keymap)
        inputs.loadKeyMap(keyMap[setting.keymap]);


    // Handle the start button
    var start_single = document.getElementById("start-single");
    start_single.addEventListener("click", function(){
        
        menuRootObj.style.display = "none";
    });
    start_single.focus();

    
    // register game ending callback
    game.onGameOver(function(win) {
        menuRootObj.style.display = "block";
    });
}
})(this, "menu");