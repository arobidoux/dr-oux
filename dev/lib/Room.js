const uuidv1 = require("uuid/v1");
const fs = require("fs");
const path = require("path");
const atob = require("atob");
const btoa = require("btoa");

const File = require("./File");
const Board = require("../../assets/js/Board");

var nextRoomID=1;

class Room {
    constructor(name, io, game) {
        this._name = name;
        this._io = io;
        this._game = game;
        this._clients = [];
        this._boards = {};
        this._gameInProgress = false;
        this._uuid = uuidv1();
        this._id = nextRoomID++;
        this._game_rules = {};

        this._previous_game_uuid = null;
        this._quiet_update = false;
        this._initializing = null;

        this._io.emit("room_created", this.summary());
    }

    get socRoomName() {
        return "room-" + this._id;
    }

    get name() {
        return this._name;
    }

    get inProgress() {
        return this._gameInProgress;
    }

    get uuid() {
        return this._uuid;
    }

    /**
     * return a summary to the client
     */
    summary() {
        var clientReady=0;
        for(var i=0;i<this._clients.length; i++)
            if( this._clients[i].ready )
                clientReady++;

        return {
            name: this._name,
            uuid: this._uuid,
            clientCount: this._clients.length,
            clientReady: clientReady,
            gameInProgress: this._gameInProgress,
            gameRules: this._game_rules
        };
    }

    generateDetails() {
        if(this._initializing) {
            return this._initializing.then(()=>{return this._generateDetailSync()});
        }
        else {
            return new Promise((resolve, reject) => { resolve(this._generateDetailSync()) });
        }
    }

    _generateDetailSync() {
        var details = this.summary();
        details.clients = [];
        details.gameInProgress= this._gameInProgress;
        details.startingIn = this._countdown;

        for(var i=0;i<this._clients.length;i++) {
            var clientDetails = this._clients[i].getDetails();
            if(typeof(this._boards[this._clients[i].uuid])!=="undefined")
                clientDetails.board = encodeFrame(this._boards[this._clients[i].uuid].board.getNewFrame(true));

            details.clients.push(clientDetails);
        }

        return details;
    }

    setGameRules(rule) {
        this._game_rules = rule;
        this._io.emit("room_updated", this.summary());
    }

    addClient(client) {
        // returning client
        if(typeof(this._boards[client.uuid]) !== "undefined") {
            client.setId(this._boards[client.uuid].id);
        }
        else if(this._gameInProgress) {
            this._boards[client.uuid] = {
                board: new Board(),
                id: client.id
            };

            // add the late player to the list
            if(this._meta) {
                this._meta.write(client.uuid + " " + client.name + "\n");
            }
        }

        this._clients.push(client);
        //this._io.emit("room_updated", this.summary());
        if(!this._quiet_update)
            this._io.emit("update_one_client",client.getDetails());
    }
    
    removeClient(client) {
        for(var i=0; i<this._clients.length;i++) {
            if(this._clients[i].id == client.id) {       
                //console.log("[Room::" + this._name + "] Removing client at idx " + i);
                this._clients.splice(i,1);
            }
        }

        if(this._clients.length == 0) {
            if(!this._quiet_update) {
                this._game.removeRoom(this._name);
            }

            this._io.emit("room_removed", {
                name: this._name,
                uuid: this._uuid
            });
        }

        client._room = null;

        if(!this._quiet_update) {
            if(this._clients.length > 0) {
                this._io.emit("room_updated", this.summary());
            }

            this._io.emit("update_one_client", client.getDetails());
        }
    }

    oneMoreReady() {
        if(this._gameInProgress)
            return false;
        
        var summary = this.summary();

        if(summary.clientCount <= summary.clientReady) {
            this.launchGame();
            summary = this.summary();
        }
        this._io.emit("room_updated", summary);
    }

    launchGame() {
        if(this._gameInProgress)
            return;
        
        this._gameInProgress = true;

        // countdown
        this.countDown(3);

        // send update to Client instances
        this._initReplayFolder().then((folder)=>{
            for (let i = 0; i < this._clients.length; i++) {
                this._clients[i].setReplayFolder(folder);
            }
            // write meta info
            
            this._meta = new File(path.join(folder,"meta"));
            
            var meta = "started " + (new Date()).toISOString() + "\n";

            if(this._previous_game_uuid) {
                meta += "previous-game " + this._previous_game_uuid + "\n";
            }

            meta += "players\n";
            for(var i=0; i<this._clients.length ; i++) {
                meta += this._clients[i].uuid + " " + this._clients[i].name + "\n";
            }

            this._meta.write(meta);
        });

        // make a list of the clients
        for(var i=0;i<this._clients.length;i++) {
            this._boards[this._clients[i].uuid] = {
                board:new Board(),
                client_id: this._clients[i].id
            };
        }
    }

    _initReplayFolder() { 
        return new Promise((resolve, reject) => {
            var folder = path.resolve("../replay/", this._uuid);
            fs.access(folder, fs.constants.F_OK, (err) => {
                if(err) {
                    // create it
                    fs.mkdir(folder, (err)=>{
                        if(err) {
                            console.error("[Game Replay] Failed to create folder " + folder + "\n\terr:"+err);
                        }
                        else {
                            resolve(folder);
                        }
                    });
                }
                else {
                    console.error("[Game Replay] replay folder " + folder + " already exists.");
                    reject();
                }
              });
        });
    }

    countDown(sec) {
        console.log("Countdown " + sec);
        if(sec) {
            this._countdown = sec;
            this._io.in(this.socRoomName).emit("countdown", {sec:sec});
            setTimeout(this.countDown.bind(this, sec-1), 1000);
        }
        else {
            this._countdown = 0;
            this.startGame();
        }
    }

    startGame() {
        console.log("Starting");
        this._io.in(this.socRoomName).emit("start");
    }
    
    _sendHandicap(target_idx, frame) {
        if(typeof(this._clients[target_idx]) !== "undefined")
            this._clients[target_idx].sendHandicap(frame);
    }
    processHandicap(client, frame) {
        // determine who should get the handicap
        switch(this._game_rules.combos) {
            case "normal-rr":
                //"label": "Normal Round Robin",
                //"description": "Send to each opponent, one at the time"

                // initialize
                if(typeof(this._handicap_normal_rr) === "undefined")
                    this._handicap_normal_rr = {};

                if(typeof(this._handicap_normal_rr[client.id]) === "undefined") 
                    this._handicap_normal_rr[client.id] = 0;


                // process
                var idx = 0;
                for(var i=0; i<this._clients.length; i++) {
                    if(this._clients[i].id == client.id) {
                        idx = i;
                        break;
                    }
                }

                var offset = this._handicap_normal_rr[client.id]++;
                var target = offset % (this._clients.length-1);
                if(target >= idx)
                    target++;
                
                this._sendHandicap(target,frame);
            break;
            
            case "roundrobin":
                //"label": "Round Robin",
                //"description": "Every combos will send to the next player (potentially sending it to the sender)"
                
                // initialize
                if(typeof(this._handicap_rr_idx) === "undefined")
                    this._handicap_rr_idx=0;

                // process
                this._sendHandicap(this._handicap_rr_idx++%this._clients.length, frame);
            break;
            case "none":
                //"label": "None",
                //"description": "Nothing will be sent..."
            break;
            case "multiplier":
                //"label": "Multiplier",
                //"description": "Always send to every opponents"
                for(var i=0;i<this._clients.length;i++) {
                    if(this._clients[i].uuid != client.uuid)
                        this._clients[i].sendHandicap(frame);
                }
            break;
            case "punitive":
                //"label": "Punitive",
                //"description": "Return to Sender, always send to the player who played the combo"
                client.sendHandicap(frame);
            break;
        }
    }

    graspVictory(client) {
        this._io.in(this.socRoomName).emit("gameover", {winner:client.getDetails()});

        // write victor in the meta file
        if(this._meta) {
            this._meta.write(
                "\nVictory: " + client.uuid + "\n" +
                "end " + (new Date()).toISOString() + "\n"
            );
        }

        // prepare next game
        var nextUuid = this.rematch();

        if(this._meta) {
            this._meta.write("\nnext-game " + nextUuid + "\n");
            this._meta.close();
            this._meta = null;
        }
    }

    playFrame(client, frame) {
        // tell everybody else
        client._soc.to(this.socRoomName).emit("frame-"+client._id, frame);

        // update our internal board
        if(typeof(this._boards[client.uuid]) !== "undefined")
            this._boards[client.uuid].board.playFrame(decodeFrame(frame));
    }

    announceDefeat(client) {
        // check if only 1 remain
        var pending_idxs = [];
        for(var i=0;i<this._clients.length;i++)
            if(this._clients[i].isGamePending())
                pending_idxs.push(i);
        
        if(pending_idxs.length == 1) {
            this.graspVictory(this._clients[pending_idxs[0]]);
        }
    }

    rematch() {
        this._quiet_update = true;
        this.reset();

        // add a copy of this room
        var newRoom = new Room(this._name, this._io, this._game);
        newRoom._previous_game_uuid = this._uuid;
        newRoom._quiet_update = true;
        // add the Room to the Game
        this._game.replaceRoom(newRoom);

        newRoom._initializing = new Promise((resolve, reject)=>{
            setTimeout(()=>{
                // transfer the clients
                while(this._clients.length)
                this._clients[0].join(newRoom);
                
                newRoom._quiet_update = false;
                resolve();
            });
        });

        return newRoom.uuid;
    }

    reset() {
        this._gameInProgress = false;
        for(var i=0;i< this._clients.length; i++)
            this._clients[i].reset();
    }
}


// look to centralize this
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

module.exports = Room;