/**
 * Provide connectivity to the server and add feature for the Multiplayer mode
 */

(function (global, ns){
    "use strict";
    function Multiplayer(game) {
        this._socket = io();
        this._game = game;
        this._name = null;

        this._socket.on("error",this.error.bind(this));
        this._socket.once("connect",this.on_connect.bind(this));
        this._socket.once("ready",this.on_ready.bind(this));
        this._socket.once("countdown",this.on_countdown.bind(this));
        this._socket.once("start",this.on_start.bind(this));
        this._socket.once("gameover",this.on_gameover.bind(this));

        this._opponents = [];
    }

    Multiplayer.prototype.error = function(err) {
        alert("Error occured:" + err);
    };


    Multiplayer.prototype.join = function(room) {
        this._socket.emit("join", {room:room}, function(roomDetails){
            if(roomDetails.error) {
                return this.error(roomDetails.error);
            }

            // display players
            console.debug(room.clients);
        }.bind(this));
    };

    Multiplayer.prototype.readyToStart = function() {
        this._socket.emit("ready");
       
        // prepare game for streaming
        this._game.prepareMultiPlayer();
        this._game._mainPillBottle.streamTo(function(frame){
            // encode it
            var encoded = "";
            for(var i=0;i<frame.length;i++) 
            encoded += String.fromCharCode(frame[i]);

            this._socket.emit("frame", btoa(encoded));
        }.bind(this));
    };


    Multiplayer.prototype.on_connect = function() {
        //this._name = prompt("Please input your name:");
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
            var frame = [];

            var r = atob(encoded);

            for(var i=0;i<r.length;i++) 
                frame.push(r.charCodeAt(i));
            
            handle(frame);
        });
    };

    Multiplayer.prototype.on_countdown = function(data) {
        console.debug("Game starting in", data.sec, "sec");
    };

    Multiplayer.prototype.on_start = function(data) {
        var difficulty = 1;
        this._game.setForMultiPlayer(parseInt(difficulty));
        this._game.run();
    };

    Multiplayer.prototype.on_gameover = function(data) {
        this._game.stop();
        alert("You lost!");
        this.resetGame();
    };

    Multiplayer.prototype.resetGame = function() {
        for(var i=0; i < this._opponents.length; i++) {
            this._opponents[i].destroy();
        }
        this._opponents = [];
    };

    function authenticate() {
        this._socket.emit("authenticate",{
            name: this._name
        }, function(welcome){
            if(welcome.error) {
                return this.error(welcome.error);
            }
            // list the rooms, and allow to join in one
            welcome.rooms;

            // TEST
            if(welcome.rooms.length)
                this.join(welcome.rooms[0].name);
            else
                this.join("room1");
        }.bind(this));
    }

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
