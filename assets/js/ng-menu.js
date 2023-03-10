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
    pref($scope,["my_settings.sensitivity","sensitivity"], 16, parseInt, function(newValue, oldValue){
        game.touch_sensitivity = newValue;
    });
    
    var defaultControl = "arrows";
    switch(getMobileOperatingSystem()) {
        case "Android": case "iOS":
            defaultControl = "tap";
            break;
    }

    pref($scope,["my_settings.controls","controls"], defaultControl, null, function(newValue, oldValue){
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
    pref($scope,["my_settings.multi_name","multi_name"], preference("multi-name",""));
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
        var parts = name.split(".");
        var e = $scope;
        for(var i=0;i < parts.length;i++)
            e = e[parts[i]];
        return e;
    };

    menu.set = function(name,value) {
        return new Promise(function(resolve, reject){
            $timeout(function(){
                var parts = name.split(".");
                var e = $scope;
                while(parts.length > 1) {
                    var k = parts.shift();
                    if(typeof(e[k]) === "undefined")
                        e[k] = {};

                    e = e[k];
                }

                e[parts[0]] = value;
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

    $scope.showStats = function(state) {
        $scope.stats = state === false ? state : true;
    };

    $scope.pillefficacy = function(player) {
        // a copy exists in the ng-stats.js file
        return Math.floor( (player.viruskilled*3) / (player.pillcount*2) * 1000 ) / 10;
    };

    $scope.pillwasted = function(player) {
        return Math.floor( player.endclutter / (player.pillcount*2) * 1000) / 10;
    };

    $scope.formatTime = function(ms) {
        var r = "";
        var s = Math.floor(ms/1000);
        if(s > 60) {
            var m = Math.floor(s/60);
            s -= 60*m;
            r += m+"m ";
        }
        r += s+"s";
        return r;
    };

    $scope.host = function() {
        if($scope.hosting)
            return;
        
        $scope.hosting = true;
        multiplayer.join($scope.my_settings.multi_name + "'s Game");
    };

    $scope.join = function(room) {
        $scope.hosting = false;
        $scope.room_uuid = null;
        
        $scope.is_ready = false;
        $scope.chats = [];

        game.setSoundTrack(getSoundTrack($scope.soundtrack));
        multiplayer.join(room.name);
    };

    $scope.ready = function() {
        if($scope.is_ready)
            return;

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
        var swaps = menu.get("keyMap." + menu.get("my_settings.controls") + ".tapSwap");

        var tap = new TapController(document.getElementsByTagName("body")[0], null, swaps);
        tap.display();
        tap._root.addEventListener("click", function(){
            tap.destroy();
        });
    };

    var tapMap = {
        40: "DOWN",
        38: "UP",
        37: "LEFT",
        39: "RIGHT",
        88: "ROTATE_CLOCKWISE",
        90: "ROTATE_COUNTER_CLOCKWISE",
        19: "PAUSE",
        27: "ESC"
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
            map: tapMap
        },
        tap: {
            label: "Tap",
            map: tapMap
        },
        "tap-joel": {
            label: "Tap - Jo??l",
            map: tapMap,
            tapSwap: {
                DOWN: "B",
                SINK: "A",
                A: "SINK",
                B: "DOWN"
            }
        },
        wasd: {
            label: "WASD + ??? ???",
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

    $scope.soundtracks = [
        { value:"none", label:"None"},
        { value:"random", label:"Random"},
        { value:"wii-fever", label:"Wii Fever"},
        { value:"wii-chill", label:"Wii Chill"},
        { value:"wii-cough", label:"Wii Cough"},
        { value:"wii-sneeze", label:"Wii Sneeze"}
    ];

    menuInitialized.resolve();

    function getSoundTrack(soundtrack) {
        if(soundtrack === "random") {
            var count = $scope.soundtracks.length-2;
            var idx = Math.floor(Math.random()*count);
            for(var i=0;i<$scope.soundtracks.length;i++) {
                if($scope.soundtracks[i].value == "none" || $scope.soundtracks[i].value == "random") {
                    continue;
                }
                else if(--idx<=0) {
                    return $scope.soundtracks[i].value;
                }
            }
        }
        else if(soundtrack === "none") {
            return null
        }
    
        return soundtrack;
    }
}


global[ns] = menu;
return;

})(this, "menu");