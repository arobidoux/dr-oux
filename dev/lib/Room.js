const config = require("../config");
const uuidv1 = require("uuid/v1");
const fs = require("fs");
const path = require("path");
const atob = require("atob");
const btoa = require("btoa");

const File = require("./File");
const Board = require("../../assets/js/Board");

const spawn = require("child_process").spawn;

var nextRoomID=1;

class Room {
    constructor(name, io, game) {
        this._name = name;
        this._io = io;
        this._game = game;
        this._clients = [];
        this._boards = {};
        this._gameInProgress = false;
        this._gameOver = false;
        this._uuid = uuidv1();
        this._id = nextRoomID++;
        this._game_rules = {};
        this._log_prefix = "";

        this._previous_game_uuid = null;
        this._quiet_update = false;
        this._initializing = null;

        this._io.emit("room_created", this.summary());
        this.log("Room created");
    }

    log(msg) {
        console.log("[" + this._log_prefix + this._name + "] " + msg);
    }

    logErr(msg) {
        console.error("[" + this._log_prefix + this._name + "] " + msg);
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
        this.log("Rules updated " + JSON.stringify(rule));
    }

    addClient(client, board) {
        this._clearRoomRemoval();

        // returning client
        if(typeof(this._boards[client.uuid]) !== "undefined") {
            client.setId(this._boards[client.uuid].id);
            // re-send it to everybody
            client.lateReady();
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

        if(board && typeof(this._boards[client.uuid]) != "undefined") {
            this._boards[client.uuid].board.playFrame(decodeFrame(board));
        }

        this._clients.push(client);
        this.log("Client added " + client.name);
        //this._io.emit("room_updated", this.summary());
        if(!this._quiet_update)
            this._io.emit("update_one_client",client.getDetails());
    }

    _clearRoomRemoval() {
        if(this._remove_room_timeout) {
            this.log("Cancelling room removal");
            clearTimeout(this._remove_room_timeout);
            this._remove_room_timeout = null;
        }
    }

    _removeRoomIn(delay) {
        this.log("Removing room in " + delay);
        this._remove_room_timeout = setTimeout(()=>{
            this._remove_room_timeout = null;
            this._removeRoom();
        }, delay);
    }

    _removeRoom() {
        if(!this._quiet_update) {
            this._game.removeRoom(this._name);
        }

        this.log("Room removed");

        this._io.emit("room_removed", {
            name: this._name,
            uuid: this._uuid
        });
    }
    
    removeClient(client) {
        for(var i=0; i<this._clients.length;i++) {
            if(this._clients[i].id == client.id) {       
                //console.log("[Room::" + this._name + "] Removing client at idx " + i);
                this._clients.splice(i,1);
                this.log("Client removed " + client.name);
            }
        }

        if(this._clients.length == 0) {
            if(this._gameInProgress) {
                // give it some time, in case this is a timeout issue
                this._removeRoomIn(15000);
            }
            else {
                // game not in progress, remove it right away
                this._removeRoom();
            }
        }

        client._room = null;

        if(!this._quiet_update) {
            if(this._clients.length > 0) {
                this._io.emit("room_updated", this.summary());
            }

            this._io.emit("update_one_client", client.getDetails());
        }

        // give an opportunity to start the game if the player was kicked
        this.oneMoreReady();
    }

    oneMoreReady() {
        if(this._gameInProgress || this._gameOver)
            return false;
        
        var summary = this.summary();

        if(summary.clientCount && summary.clientCount <= summary.clientReady) {
            this.launchGame();
            summary = this.summary();
        }
        this._io.emit("room_updated", summary);
    }

    launchGame() {
        if(this._gameInProgress)
            return;
        
        this._gameInProgress = true;

        this.log("Launching game");

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
            var folder = path.resolve(config.storage.replay,this._uuid);
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
        this.log("Countdown " + sec);
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
        this.log("Starting");
        this._io.in(this.socRoomName).emit("start");
    }
    
    _sendHandicap(target_idx, frame) {
        if(typeof(this._clients[target_idx]) !== "undefined")
            this._clients[target_idx].sendHandicap(frame);
    }

    _handicap_rr(client, frame) {
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
    }

    processHandicap(client, frame) {
        // determine who should get the handicap
        switch(this._game_rules.combos) {
            case "normal-rr":
                //"label": "Normal Round Robin",
                //"description": "Send to each opponent, one at the time"

                this._handicap_rr(client, frame);
            break;

            case "coop-rr":
                //"label": "Cooperative Round Robin",
                //"description": "to each opponent, one at a time, but will try to drop it on the right colors"
            
                this._handicap_rr(client, frame);
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
        this.log("Victory grasped");
        this._log_prefix += "-";
        this._gameOver = true;
        
        this._io.in(this.socRoomName).emit("gameover", {winner:client.getDetails()});

        // write victor in the meta file
        if(this._meta) {
            this._meta.write(
                "\nVictory: " + client.uuid + "\n" +
                "end " + (new Date()).toISOString() + "\n"
            );
        }

        // prepare next game
        var nextRoom = this.rematch();

        var resetPromises = [];

        if(this._meta) {
            this._meta.write("\nnext-game " + nextRoom.uuid + "\n");
            resetPromises.push(this._meta.close());
            this._meta = null;
        }

        
        for(var i=0;i< this._clients.length; i++)
            resetPromises.push(this._clients[i].reset());

        Promise.all(resetPromises)
        .then(()=>{
            return this.analyze();
        })
        .then((stats)=>{
            this._io.in(this.socRoomName).emit("statsready", {stats:stats});
        })
        .then(()=>{
            this.log("initiating transfer to new game");
            nextRoom.transfer();
        })
        .catch((err)=>{
            this.logErr(err);
            console.error(err);
        });
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
        this._gameInProgress = false;

        // add a copy of this room
        var newRoom = new Room(this._name, this._io, this._game);
        newRoom._previous_game_uuid = this._uuid;
        newRoom._quiet_update = true;
        // add the Room to the Game
        this._game.replaceRoom(newRoom);

        var result = {
            uuid: newRoom.uuid,  
        };
        var transfer_promise = new Promise((resolve, reject)=>{
            result.transfer = resolve;
        });

        newRoom._initializing = transfer_promise.then(()=>{
            return new Promise((resolve, reject)=>{
                this.log("Transfering Clients");
                // transfer the clients
                while(this._clients.length)
                    this._clients[0].join(newRoom);
                
                newRoom._quiet_update = false;
                resolve();
            });
        });

        return result;
    }

    analyze(delay) {
        return new Promise((resolve, reject)=>{
            this.log("Queuing analysis");
            var args = ["scripts/analyze-replay.js","-p", this.uuid];
            setTimeout(()=>{
                this.log("Spawning analysis");
                var stdout = "";
                var prc = spawn("node", args, {cwd:path.resolve(__dirname,"../")});
                
                prc.stdout.setEncoding("utf8");
                prc.stdout.on("data", (data) => {
                    stdout += data.toString();
                });
                
                prc.stderr.setEncoding("utf8");
                prc.stderr.on("data", (data) => {
                    this.logErr(data.toString());
                });
                
                prc.on("close", (code) => {
                    if(code != 0) {
                        this.logErr(`analyze returned err code ${code}`);
                        reject(code);
                    }
                    else {
                        this.log("analisis completed");
                        resolve(JSON.parse(stdout));
                    }
                });
            }, delay);
        });
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