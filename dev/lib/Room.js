const uuidv1 = require("uuid/v1");
const fs = require("fs");
const path = require("path");
const atob = require("atob");
const btoa = require("btoa");

const File = require("./File");
const Client = require("./Client");
const Board = require("../../assets/js/Board");

class Room {
    constructor(name, io, game) {
        this._name = name;
        this._io = io;
        this._game = game;
        this._clients = [];
        this._boards = {};
        this._gameInProgress = false;
        this._uuid = uuidv1();
        this._game_rules = {};

        this._io.emit("room_created", this.summary());        
    }

    get socRoomName() {
        return "room-" + this._name;
    }

    get name() {
        return this._name;
    }

    get inProgress() {
        return this._gameInProgress;
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
        return new Promise((resolve, reject) => {
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

            resolve(details);
        });
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
        }

        this._clients.push(client);
        //this._io.emit("room_updated", this.summary());
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
            this._game.removeRoom(this._name);
            this._io.emit("room_removed", {
                name: this._name,
                uuid: this._uuid
            });
        }
        else {
            this._io.emit("room_updated", this.summary());
        }

        client._room = null;
        this._io.emit("update_one_client", client.getDetails());

        //console.log("[Room::" + this._name + "] no matching client for id " + client.id);
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
            return false;
        
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

            meta += "players\n";
            for(var i=0; i<this._clients.length ; i++) {
                meta += this._clients[i].uuid + " " + this._clients[i].name + "\n";
            }

            meta += "\n";
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
                "Victory: " + client.uuid + "\n" +
                "end " + (new Date()).toISOString() + "\n"
            );
            this._meta.close();
            this._meta = null;
        }
        this.reset();
    }

    playFrame(client, frame) {
        // tell everybody else
        client._soc.to(this.socRoomName).emit("frame-"+client._id, frame);

        // update our internal board
        this._boards[client.uuid].board.playFrame(decodeFrame(frame));
    }

    announceDefeat(client) {
        // check if only 1 remain
        var pending_idxs = [];
        for(var i=0;i<this._clients.length;i++)
            if(this._clients[i]._game_status == Client.GAME_STATUS.PENDING)
                pending_idxs.push(i);
        
        if(pending_idxs.length == 1) {
            this.graspVictory(this._clients[pending_idxs[0]]);
        }
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