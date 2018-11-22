const uuidv1 = require("uuid/v1");
const fs = require("fs");
const path = require("path");
const File = require("./File");

class Room {
    constructor(name, io, game) {
        this._name = name;
        this._io = io;
        this._game = game;
        this._clients = [];
        this._gameInProgress = false;
        this._uuid = uuidv1();

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
            clientCount: this._clients.length,
            clientReady: clientReady,
            gameInProgress: this._gameInProgress
        };
    }

    generateDetails() {
        return new Promise((resolve, reject) => {
            var details = {
                clients: [],
                gameInProgress: this._gameInProgress
            };

            for(var i=0;i<this._clients.length;i++)
                details.clients.push(this._clients[i].getDetails());

            resolve(details);
        });
    }

    addClient(client) {
        this._clients.push(client);
        this._io.emit("room_updated", this.summary());
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
                name: this._name
            });
        }
        else {
            this._io.emit("room_updated", this.summary());
        }

        this._io.emit("update_one_client",client.getDetails());

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
        this.countDown(5);

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
            this._io.in(this.socRoomName).emit("countdown", {sec:sec});
            setTimeout(this.countDown.bind(this, sec-1), 1000);
        }
        else {
            this.startGame();
        }
    }

    startGame() {
        this._io.in(this.socRoomName).emit("start");
    }

    
    processHandicap(client, frame) {
        client._soc.to(this.socRoomName).emit("handicap", frame);
    }

    graspVictory(client) {
        client._soc.to(this.socRoomName).emit("gameover", {winner:client.getDetails()});
        // write victor in the meta file
        this._meta.write(
            "Victory: " + client.uuid + "\n" +
            "end " + (new Date()).toISOString() + "\n"
        );
        this._meta.close();
        this._meta = null;
        this.reset();
    }

    reset() {
        this._gameInProgress = false;
        for(var i=0;i< this._clients.length; i++)
            this._clients[i].reset();
    }
}

module.exports = Room;