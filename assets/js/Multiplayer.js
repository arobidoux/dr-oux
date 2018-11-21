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
        }.bind(this));
    }

    Multiplayer.prototype.error = function(err) {
        alert("Error occured:" + err);
    };


    Multiplayer.prototype.join = function(room) {
        this._socket.emit("join", {room:room}, function(roomDetails){
            if(roomDetails.error) {
                return this.error(roomDetails.error);
            }

            var elem = upsertRoom({name:room});
            elem.className = "active";
            // display players
            console.debug(room.clients);
        }.bind(this));
    };

    Multiplayer.prototype.readyToStart = function(difficulty) {
        var p = new Promise(function(resolve, reject){
            this._start_resolve = resolve;
            this._start_reject = reject;

            this._difficulty = parseInt(difficulty);
            this._socket.emit("ready");
            
            // prepare game for streaming
            this._game.prepareMultiPlayer();
            this._game._mainPillBottle.streamTo(function(frame){
                this._socket.emit("frame", encodeFrame(frame));
            }.bind(this));
        }.bind(this));

        var cleanUp = function(){
            this._start_resolve = null;
            this._start_reject = null;
        }.bind(this);
        
        p.then(cleanUp, cleanUp);

        return p;
    };


    Multiplayer.prototype.once_connect = function() {
        this._name = document.getElementById("multi_name").value;
        if(!this._name) {
            if(this._name = preference("multi-name", null)) {
                // we're good
            }
            else {
                this._name = prompt("Please input your name:");
                preference.set("multi-name", this._name);
            }
        }
        
        if(!this._name) {
            pickRandomName().then(function(name) {
                this._name = name;
                authenticate.call(this);
            }.bind(this));
        }
        else {
            authenticate.call(this);
        }
    };

    Multiplayer.prototype.on_ready = function(data) {
        console.debug(data.name, "is ready to play");

        var bottle = new PillBottle({
            root:document.getElementById("opponents"),
            title: data.name
        });

        this._opponents.push(
            {
                id: data.id,
                bottle: bottle
            }
        );

        var handle = bottle.generateStreamHandler();
        this._socket.on("frame-"+data.id, function(encoded) {
            handle(decodeFrame(encoded));
        });
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
        this._start_resolve && this._start_resolve();
        this._game.setStatus("Game starting in " + data.sec + " second" + (data.sec > 1 ? "s" :"" ));
    };

    Multiplayer.prototype.on_start = function(data) {
        this._start_resolve && this._start_resolve();
        this._game.setForMultiPlayer(this._difficulty);
        this._game.run();
    };

    Multiplayer.prototype.on_gameover = function(data) {
        this._game.stop();
        alert("You lost!");
        this.resetGame();
    };

    Multiplayer.prototype.on_room_created = function(data) {
        upsertRoom(data);
    };

    Multiplayer.prototype.on_room_updated = function(data) {
        upsertRoom(data);
    };

    Multiplayer.prototype.on_room_removed = function(data) {
        var id = generateRoomID(data);
        var elem = document.getElementById(id);
        if(elem && elem.parentElement)
            elem.parentElement.removeChild(elem);
    };

    Multiplayer.prototype.on_handicap = function(encoded) {
        this._game._mainPillBottle._board.queueHandicap(decodeFrame(encoded));
    };

    Multiplayer.prototype.on_client_update = function(data) {
        var updated = [];
        for(var i=0;i<data.clients.length;i++) {
            updated.push(upsertPlayer(data.clients[i]));
        }

        upsertPlayer.removeNotIn(updated);
    };

    Multiplayer.prototype.resetGame = function() {
        for(var i=0; i < this._opponents.length; i++) {
            this._opponents[i].bottle.destroy();
        }
        this._opponents = [];
    };

    Multiplayer.prototype.tick = function(tick) {
        if(this._game._game_stats && this._game._game_stats.combos && this._game._game_stats.combos.length > 1) {
            this._socket.emit("combos", encodeFrame(this._game._game_stats.combos));
        }
    };

    function authenticate() {
        document.getElementById("multi_name").value = this._name;
        this._socket.emit("authenticate",{
            uuid: uuid,
            name: this._name
        }, function(welcome){
            if(welcome.error) {
                return this.error(welcome.error);
            }
            /*
            // list the rooms, and allow to join in one
            var root = document.getElementById("multi-rooms");
            // empty the current room list
            while(root.lastChild &&
                root.lastChild.nodeType == 1 &&
                root.lastChild.getAttribute("id") != "multi-room-template"
            ) {
                root.removeChild(root.lastChild);
            }

            for(var i=0;i<welcome.rooms.length;i++) {
                upsertRoom(welcome.rooms[i]);
            }
            */

            upsertPlayer.clear();
            for(var i=0;i<welcome.clients.length;i++) {
                upsertPlayer(welcome.clients[i]);
            }
        }.bind(this));
    }

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
            elem.className += (elem.className?" ":"")+ obj.status;
        }
    );
    
    function generateUpsertElem(template, generateId, field_value_selector, postCreate) {
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
        return "player-row-" + btoa(client.name).replace(/[=+/]/g, "_");
    };

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
