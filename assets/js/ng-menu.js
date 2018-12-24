(function (global, ns){
    "use strict";

var menu = {};
var app = angular.module("app",[]);

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
        // Windows Phone must come first because its UA also contains "Android"
      if (/windows phone/i.test(userAgent)) {
          return "Windows Phone";
      }
  
      if (/android/i.test(userAgent)) {
          return "Android";
      }
  
      // iOS detection from: http://stackoverflow.com/a/9039885/177710
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
          return "iOS";
      }
  
      return "unknown";
  }

menu.contentloaded = new Promise(function(resolve, reject){
    app.factory("contentLoaded",function(){
        return {
            resolve: resolve,
            reject: reject
        };
    });
});

menu.init = new Promise(function(resolve, reject){
    app.factory("menuInitialized",function(){
        return {
            resolve: resolve,
            reject: reject
        };
    });

    app.factory("pref", function(){
        return function(scope, name, defaultValue, format, onChange) {
            var scope_name = typeof(name) === "string" ? name : name[0];
            var pref_key = typeof(name) === "string" ? name : name[1];

            var v = preference(pref_key, defaultValue);
            if(typeof(format) === "function")
                v = format(v);
            
            var parts = scope_name.split(".");
            var parent = scope;
            for(var i=0; i<parts.length-1;i++) {
                if(typeof(parent[parts[i]]) === "undefined")
                    parent[parts[i]] = {};
                parent = parent[parts[i]];
            }

            parent[parts[parts.length-1]] = v;
            
            scope.$watch(scope_name,function(newValue,oldValue){
                if(oldValue != newValue) {
                    preference.set(pref_key, typeof(newValue) === "object" && newValue ? JSON.stringify(newValue): newValue);
                }
                if(typeof(onChange)==="function")
                    onChange.apply(this, arguments);
            });
        };
    });

    app.controller("MenuController",["$scope", "$timeout", "pref", "menuInitialized", "contentLoaded", MenuController]);
});

function MenuController($scope, $timeout, pref, menuInitialized, contentLoaded){
    $scope.uuid = null;
    $scope.my_settings = {};

    pref($scope,["my_settings.difficulty","difficulty"], 4, parseInt, function(newValue, oldValue){
        multiplayer.setDifficulty(newValue)
    });
    pref($scope,"sensitivity", 16, parseInt, function(newValue, oldValue){
        game.touch_sensitivity = newValue;
    });
    
    var defaultControl = "arrows";
    switch(getMobileOperatingSystem()) {
        case "Android": case "iOS":
            defaultControl = "tap";
            break;
    }

    pref($scope,"controls", defaultControl, null, function(newValue, oldValue){
        inputs.clearAll();
        inputs.loadKeyMap($scope.keyMap[newValue].map);
    });
    pref($scope,"soundtrack", "random", null, function(newValue, oldValue) {
        if(newValue != oldValue && newValue != "random" && newValue != "none") {
            Sounds.play(newValue);
        }
    });
    pref($scope,["my_settings.volume", "volume"], 1, parseInt, function(newValue, oldValue) {
        Sounds.setVolume(newValue);
    });
    pref($scope,"game_rules.combos", "normal-rr", null, function(newValue, oldValue) {
        if(newValue != oldValue && $scope.hosting) {
            $timeout(function(){
                multiplayer.setGameRule($scope.game_rules);
            },0);
        }
    });
    pref($scope,"multi_name", preference("multi-name",""));
    pref($scope,["my_settings.enable_sound","enable_sound"], "yes", null, function(newValue, oldValue){
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
        return new Promise(function(resolve, reject){
            $timeout(function(){
                $scope[name] = value;
                resolve();
            });
        });
    };

    menu.push = function(name, value) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                $scope[name].push(value);
                resolve();
            });
        });
    };
    
    menu.splice = function(name, filter, ...replaceWith) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                if(typeof(filter) === "function") {
                    for(var i=0;i<$scope[name].length;i++) {
                        if(filter($scope[name][i])) {
                            $scope[name].splice(i,1, ...replaceWith);
                        }
                    }
                    resolve();
                }
                else {
                    reject(new Error("Invalid splice filter argument"));
                }
            });
        })
    };

    menu.alter = function(name, alter) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                for(var i=0;i<$scope[name].length;i++) {
                    alter($scope[name][i]);
                }
                resolve();
            });
        });
    };

    $scope.incrementDifficulty = function() {
        if(++$scope.my_settings.difficulty > 20) {
            $scope.my_settings.difficulty = 20;
        }
    };

    $scope.decrementDifficulty = function() {
        if(--$scope.my_settings.difficulty < 1) {
            $scope.my_settings.difficulty = 1;
        }
    };


    $scope.contentLoaded = function() {
        contentLoaded.resolve();
    };

    $scope.invite = function(player) {
        player.invited=true;
        multiplayer.invite(player.uuid);
    };

    $scope.kick = function(player) {
        multiplayer.kick(player.uuid);
    };

    $scope.tryAudio = function() {
        $scope.require_click_to_play = false;
        Sounds.warmup().then(function(){
            Sounds.play("wii-title");
        });
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

    $scope.clearError = function() {
        $scope.error = "";
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
        multiplayer.readyToStart(parseInt($scope.my_settings.difficulty));
        $scope.is_ready = true;
    };

    $scope.submitChat = function(msg) {
        if(msg)
            multiplayer.chat(msg);
    };

    $scope.startSingle = function() {
        $scope.playing = true;
        game.setSoundTrack(getSoundTrack($scope.soundtrack));
        $timeout(function(){
            game.startSinglePlayer(parseInt($scope.my_settings.difficulty));
            game.run();
        },0);
    };

    $scope.orderMyRoomFirst = function(item) {
        return item.uuid == $scope.room_uuid ? "" : item.name;
    };

    $scope.leaveRoom = function() {
        multiplayer.leave();
        $scope.hosting = false;
    };

    $scope.preview_tap_controls = function() {
        var tap = new TapController(document.getElementsByTagName("body")[0]);
        tap.display();
        tap._root.addEventListener("click", function(){
            tap.destroy();
        });
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
                27: "ESC"
            }
        },
        swipe: {
            label: "Swipe",
            map: {
                40: "DOWN",
                38: "UP",
                37: "LEFT",
                39: "RIGHT",
                88: "ROTATE_CLOCKWISE",
                90: "ROTATE_COUNTER_CLOCKWISE",
                19: "PAUSE",
                27: "ESC"
            }
        },
        tap: {
            label: "Tap",
            map: {
                40: "DOWN",
                38: "UP",
                37: "LEFT",
                39: "RIGHT",
                88: "ROTATE_CLOCKWISE",
                90: "ROTATE_COUNTER_CLOCKWISE",
                19: "PAUSE",
                27: "ESC"
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
                27: "ESC"
            }
        }
    };

    $scope.gameRules = {
        "normal-rr": {
            "label": "Normal Round Robin",
            "description": "to each opponent, one at a time"
        },
        "roundrobin": {
            "label": "Round Robin",
            "description": "to each player, one at a time (potentially sending it to the sender)"
        },
        "none": {
            "label": "None",
            "description": "to nobody"
        },
        "multiplier": {
            "label": "Multiplier",
            "description": "to all opponents, at the same time"
        },
        "punitive": {
            "label": "Punitive",
            "description": "back to the sender"
        },
        "coop-rr": {
            "label": "Cooperative Round Robin",
            "description": "to each opponent, one at a time, but will try to drop it on the right colors"
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

})(this, "menu");