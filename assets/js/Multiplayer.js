/**
 * Provide connectivity to the server and add feature for the Multiplayer mode
 */

(function (global, ns){
    "use strict";

    var uuid = preference("multi-uuid", null);
    if(!uuid) {
        preference.set("multi-uuid",uuid = uuidv1());
    }

    function Multiplayer(game) {
        this._socket = io();
        this._game = game;
        this._name = null;
        this._difficulty = 1;
        this._opponents = [];

        this._socket.on("error",this.error.bind(this));

        // bind all `on_` method of this class
        for(var k in Multiplayer.prototype) {
            var m = k.match(/^(on(?:ce)?)_(.+)$/);
            if(m) {
                this._socket[m[1]](m[2],this[k].bind(this));
            }
        }

        this._game.onGameOver(function(state) {
            if(state) {
                this._socket.emit("victory");
            }
            else {
                this._socket.emit("defeat");
            }
            return false;
        }.bind(this));
    }

    Multiplayer.prototype.error = function(err) {
        alert("Error occured:" + err);
    };

    Multiplayer.prototype.setGameRule = function(rule) {
        this._socket.emit("set_game_rules", rule);
    };

    Multiplayer.prototype.join = function(room) {
        this._socket.emit("join", {room:room}, function(roomDetails){
            // apply rules if needed
            if(menu.get("hosting")) {
                var game_rules = menu.get("game_rules");
                if(game_rules) {   
                    this.setGameRule(game_rules);
                }
            }

            Sounds.play("wii-select");
            if(roomDetails.error) {
                return this.error(roomDetails.error);
            }
            if(roomDetails.gameInProgress) {
                var myFrame = null;
                // add the pill bottle of the other players and display their current state
                for(var i=0; i<roomDetails.clients.length; i++ ) {
                    // skip us
                    if(roomDetails.clients[i].uuid !== uuid) {
                        var opponent = addOpponent.call(this, roomDetails.clients[i]);
                        if(roomDetails.clients[i].board) {
                            opponent.bottle._board.playFrame(decodeFrame(roomDetails.clients[i].board));
                        }
                    }
                    else {
                        // set our board to what it was (should happen if we reconnect)
                        myFrame = decodeFrame(roomDetails.clients[i].board);
                    }
                }

                // auto set ready & start my game
                this.readyToStart(parseInt(menu.get("difficulty", 4))).then(function(){
                    if(myFrame) {
                        this._game._mainPillBottle._board.playFrame(myFrame);
                        this._game._mainPillBottle.record();
                    }
                    else {
                        this._game.setForMultiPlayer(this._difficulty);
                    }
                    this._game.run();
                }.bind(this));
                
                // auto start it
                if(roomDetails.startingIn == 0) {
                    menu.set("playing", true);
                    this._start_resolve && this._start_resolve();
                    this._game.setStatus("");
                }
            }
        }.bind(this));
    };

    Multiplayer.prototype._prepareStreaming = function() {
        this._game.prepareMultiPlayer();
        this._game._mainPillBottle.streamTo(function(frame){
            this._socket.emit("frame", encodeFrame(frame));
        }.bind(this));
    };

    Multiplayer.prototype.readyToStart = function(difficulty) {
        var p = new Promise(function(resolve, reject){
            this._start_resolve = resolve;
            this._start_reject = reject;

            this._difficulty = parseInt(difficulty);
            this._socket.emit("ready");
            
            // prepare game for streaming
            this._prepareStreaming();
        }.bind(this));

        var cleanUp = function(){
            this._start_resolve = null;
            this._start_reject = null;
        }.bind(this);
        
        p.then(cleanUp, cleanUp);

        return p;
    };


    Multiplayer.prototype.once_connect = function() {
        menu.init.then(function(){
            menu.set("uuid", uuid);
            this._name = menu.get("multi_name");
            if(!this._name) {
                this._name = prompt("Please input your name:");
            }
            
            if(!this._name) {
                pickRandomName().then(function(name) {
                    this._name = name;
                    menu.set("multi_name",this._name);
                    authenticate.call(this);
                }.bind(this));
            }
            else {
                menu.set("multi_name",this._name);
                authenticate.call(this);
            }
        }.bind(this));
    };

    Multiplayer.prototype

    Multiplayer.prototype.kick = function(player_uuid) {
        this._socket.emit("kick", player_uuid);
    };

    Multiplayer.prototype.on_joined = function(room) {
        menu.set("room_uuid", room.uuid);
    };

    Multiplayer.prototype.on_kicked = function() {
        menu.set("room_uuid", null);
    };

    function addOpponent(data) {
        console.debug(data.name, "is ready to play");

        var bottle = new PillBottle({
            root:document.getElementById("opponents"),
            title: data.name
        });

        var opponent = {
            id: data.id,
            uuid: data.uuid,
            bottle: bottle
        };

        this._opponents.push(opponent);

        var handle = bottle.generateStreamHandler();
        this._socket.on("frame-"+data.id, function(encoded) {
            handle(decodeFrame(encoded));
        });

        return opponent;
    }

    Multiplayer.prototype.on_ready = function(data) {
        var room_uuid = menu.get("room_uuid");
        menu.splice("players", function(player){
            if(data.uuid == player.uuid) {
                player.ready = true;

                // check if we are in the same game
                if(player.room && room_uuid && player.room.uuid==room_uuid)
                    addOpponent.call(this,data);
            }
        }.bind(this));
    };

    function encodeFrame(frame) {
        // encode it
        var encoded = "";
        for(var i=0;i<frame.length;i++) 
        encoded += String.fromCharCode(frame[i]);
        return btoa(encoded);
    }

    function decodeFrame(encoded) {
        var frame = [];
        var r = atob(encoded);
        for(var i=0;i<r.length;i++) 
            frame.push(r.charCodeAt(i));
        
        return frame;
    }

    Multiplayer.prototype.on_countdown = function(data) {
        menu.set("playing", true);
        Sounds.stopGroup("bg");
        Sounds.play("move");
        this._start_resolve && this._start_resolve();
        this._game.setStatus("Game starting in " + data.sec + " second" + (data.sec > 1 ? "s" :"" ));
    };

    Multiplayer.prototype.on_start = function(data) {
        menu.set("playing", true);
        this._start_resolve && this._start_resolve();
        this._game.setStatus("");
        this._game.setForMultiPlayer(this._difficulty);
        this._game.run();
    };

    Multiplayer.prototype.on_gameover = function(data) {
        menu.set("playing", false);
        this._game.stop();

        for(var i = 0;i<this._opponents.length;i++) {
            if(this._opponents[i].uuid == data.winner.uuid) {
                this._opponents[i].bottle.setMessage("Winner!");
            }
            else {
                this._opponents[i].bottle.setMessage("Loser");
            }
        }

        if(uuid != data.winner.uuid) {
            Sounds.play("nes-game-lost");
            this._game._mainPillBottle.setMessage("You Lost");
        }
        else {
            Sounds.play("nes-vs-game-over");
            this._game._mainPillBottle.setMessage("You won!");
        }

        var reset = function() {
            this.resetGame();
            document.removeEventListener("click", reset);
        }.bind(this);

        document.addEventListener("click", reset);
    };

    Multiplayer.prototype.on_room_created = function(data) {
        menu.push("rooms", data);
        //upsertRoom(data);
    };

    Multiplayer.prototype.on_room_updated = function(data) {
        menu.splice("rooms", function(elem) {
            return elem.uuid == data.uuid;
        }, data);
    };

    Multiplayer.prototype.on_room_removed = function(data) {
        menu.splice("rooms", function(elem) {
            return elem.uuid == data.uuid;
        });
    };

    Multiplayer.prototype.on_room_list = function(data) {
        menu.set("rooms", data.rooms);
    };

    Multiplayer.prototype.on_handicap = function(encoded) {
        console.debug("Queueing Handicap");
        
        this._game._mainPillBottle._board.queueHandicap(...decodeFrame(encoded));
    };

    Multiplayer.prototype.on_client_update = function(data) {
        menu.set("players", data.clients);
    };

    Multiplayer.prototype.on_update_one_client = function(details) {
        if(!details.room) {
            for(var i=0; i < this._opponents.length; i++) {
                if(this._opponents[i].uuid == details.uuid) {
                    this._opponents[i].bottle.destroy();
                    this._opponents.splice(i, 1);
                    break;
                }
            }
        }
            
        menu.splice("players", function(elem){
            return details.uuid == elem.uuid;
        },details);
    };

    Multiplayer.prototype.on_invited = function(data) {
        menu.push("invitations", data);
    };

    Multiplayer.prototype.on_chat = function(data) {
        menu.push("chats", data);

        // dirty fix to scroll down
        setTimeout(function(){
            var chatBoxes = document.querySelectorAll(".chat-box");
            for(var i=0;i<chatBoxes.length;i++)
                chatBoxes[i].scrollTop = chatBoxes[i].scrollHeight;
        });
    };

    Multiplayer.prototype.chat = function(msg) {
        this._socket.emit("chat", msg);
    };

    Multiplayer.prototype.resetGame = function() {
        for(var i=0; i < this._opponents.length; i++) {
            this._opponents[i].bottle.destroy();
        }
        this._opponents = [];
    };

    Multiplayer.prototype.invite = function(player_id) {
        this._socket.emit("invite", {
            players: [ player_id ]
        });
    };

    
    Multiplayer.prototype.joinPlayer = function(player_id) {
        this._socket.emit("joinPlayer", player_id);
    };

    /*
    Multiplayer.prototype.spectate = function(player_id) {
        this._socket.emit("spectate", player_id);
    };
    */

    Multiplayer.prototype.tick = function(tick) {
        if(this._game._game_stats && this._game._game_stats.combos && this._game._game_stats.combos.length > 1) {
            this._socket.emit("combos", encodeFrame(this._game._game_stats.combos));
        }
    };

    function authenticate() {
        this._socket.emit("authenticate",{
            uuid: uuid,
            name: this._name,
            meta: btoa(JSON.stringify({
                fps: this._game._fps
            }))
        });
    }
/*
    var upsertRoom = generateUpsertElem(
        document.getElementById("multi-room-template"),
        generateRoomID,
        ".room-value-%name%",
        function(elem, obj) {
            elem.setAttribute("room-name", obj.name);
        }
    );

    var upsertPlayer = generateUpsertElem(
        document.getElementById("player-template"),
        generatePlayerID,
        ".player-value-%name%",
        function(elem, obj) {
            if(obj.uuid == uuid) {
                // prevent us from being added
                elem.parentElement.removeChild(elem);
            }
            elem.setAttribute("player-uuid", obj.uuid);
        },
        function(elem, obj){
            elem.className = obj.status;
        }
    );
    
    function generateUpsertElem(template, generateId, field_value_selector, postCreate, postUpdate) {
        var root = template.parentElement;
        root.removeChild(template);

        var fn = function(obj) {
            var id = generateId(obj);
            var elem = document.getElementById(id);
            if(!elem) {
                var elem = template.cloneNode(true);
                elem.setAttribute("id", id);
                root.appendChild(elem);
                if(typeof(postCreate) === "function")
                    postCreate(elem, obj);
            }

            for(var k in obj) {
                var e = document.querySelector("#"+id+" " + field_value_selector.replace("%name%",k));
                if(e)
                    e.innerText = obj[k];
            }

            if(typeof(postUpdate) === "function")
                postUpdate(elem, obj);

            return elem;
        };

        fn.clear = function() {
            while(root.lastChid)
                root.removeChild(root.lastChid);
        };

        fn.removeNotIn = function(list) {
            var nextElem, elem = root.firstChild;
            while(elem) {
                nextElem = elem.nextElementSibling;
                if(list.indexOf(elem) == -1) {
                    root.removeChild(elem);
                }
                elem = nextElem;
            }
        };

        return fn;
    }

    function generateRoomID(room) {
        return "room-row-" + btoa(room.name).replace(/[=+/]/g, "_");
    };

    function generatePlayerID(client) {
        return "player-row-" + client.uuid;
    };
    */
    function pickRandomName() {
        return jsonp("https://randomuser.me/api/?inc=name&noinfo&callback=", 5)
        .then(function(res){
            return res.results[0].name.title + ". " + res.results[0].name.first + " " + res.results[0].name.last;
        }, function(){
            return "John Smith";
        });
    }
    global[ns] = Multiplayer;
})(this, "Multiplayer");
