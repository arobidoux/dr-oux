const path = require("path");
const Replay = require("./Replay");
const Room = require("./Room");

var nextClientID=1;

class Client {
    constructor(socket, game) {
        this._soc = socket;
        this._game = game;
        this._name = "Anonymous";
        this._uuid = null;
        this._room = null;
        this._id = nextClientID++;
        this._is_ready = false;
        this._game_status = null;
        this._replay = null;
        this._difficulty = null;

        this.log("New client connected");
        socket.on("error", (err) => { return this.error(err) });

        //socket.on("disconnecting", (reason) => { return this.on_disconnecting(reason) });
        var methods = Object.getOwnPropertyNames(Client.prototype);
        for(var i=0;i<methods.length;i++) {
            var m = methods[i].match(/^on_(.+)$/);
            if(m)
                socket.on(m[1], this[methods[i]].bind(this));
        }
    }

    get name() {
        return this._name;
    }

    get ready() {
        return this._is_ready;
    }
    
    get id() {
        return this._id;
    }

    setId(id) {
        this._id = id;
    }

    get status() {
        if(!this._room)
            return "idle";
        else if(this._room.inProgress)
            return "multi";
        else if(this._is_ready)
            return "waiting";
        else
            return "pending";
    }

    get uuid() {
        return this._uuid;
    }

    isGamePending() {
        return this._game_status == Client.GAME_STATUS.PENDING;
    }

    setReplayFolder(folder) {
        this._replay = new Replay(path.join(folder,this._uuid));
        if(this._frame_meta)
            this._replay.meta(this._frame_meta);
            
    }

    getDetails() {
        return {
            name: this._name,
            ready: this._is_ready,
            id: this._id,
            uuid: this._uuid,
            difficulty: this._difficulty,
            room: this._room && this._room.summary() || null,
            status: this.status
        };
    }

    log(...msg) {
        // TODO look to format object better
        console.log("[" + this._name + "]" + msg.join(" "));
    }

    error(...msg) {
        // TODO look to format object better
        console.error("[" + this._name + "]" + msg.join(" "));
    }

    join(room, board) {
        this.leave();
        this._is_ready = false;
        if(room instanceof Room) {
            this._room = room;
        }
        else {
            this._room = this._game.getRoom(room, this);
        }
        this._room.addClient(this, board);

        this._soc.join(this._room.socRoomName);

        this.log("Joined room " + this._room.name);

        this._room.generateDetails()
        .then((details)=>{
            this._soc.emit("joined", details);
        }, (err)=>{
            this._soc.emit("joined",{
                error: "Failled to retrieve room details",
                err: {
                    msg: err.message
                }
            });
        });
    }

    leave() {
        if (this._room) {
            this._soc.leave(this._room.socRoomName);
            var name = this._room.name;
            this._room.removeClient(this);
            this.log("Left the room", name);
            this._room = null;
        }
        else {
            this.log("Cannot leave, no room assigned");
        }
    }

    reset() {
        return new Promise((resolve, reject)=>{            
            this._is_ready = false;
            this._game_status = null;

            if(this._replay) {
                this._replay.close().then(resolve, reject);
                this._replay = null;
            }
            else {
                resolve();
            }
        });
    }

    sendHandicap(frame) {
        if(this._replay)
            this._replay.handicap(frame);
    
        this.log("Sending Handicap");
        this._soc.emit("handicap", frame);
    }

    on_disconnect(reason) {
        this._game.removeClient(this);
        this.leave();
        this.log("Disconnected: " + reason);
    }

    on_authenticate(data, ack) {
        this._name = data.name;
        this._uuid = data.uuid;
        this._frame_meta = data.meta;
        
        this.log("Authenticated")
        this._game.addClient(this);
        if(typeof(ack)==="function")
            ack();
    }

    on_log(msg) {
        this.log(">", msg);
    }

    on_chat(msg) {
        if(this._room) {
            this.log("chat:"+this._room.socRoomName+"] " + msg);
            this._game._io.in(this._room.socRoomName).emit("chat",{
                from: {
                    name: this.name,
                    uuid: this.uuid
                },
                msg: msg
            });
        }
        else {
            this.log("chat:open-channel] " + msg);
        }
    }

    on_join(data) {
        this.join(data.room, data.board);
    }

    on_set_difficulty(difficulty) {
        this._difficulty = difficulty;
        this._game._io.emit("update_one_client",this.getDetails());
    }

    on_set_game_rules(rule) {
        if(this._room) {
            this.log("Setting game rules to " + JSON.stringify(rule));
            this._room.setGameRules(rule);
        }
    }

    on_invite(data, ack) {
        if(!this._room) {
            this.join(this.name + "'s Game");
        }

        var invitation = {
            room:{
                name:this._room.name,
                uuid:this._room.uuid
            },
            from:this.getDetails()
        };

        for(var i=0;i<data.players.length;i++) {
            var p = this._game.getClient(data.players[i]);
            if(p) {
                this.log("Inviting",p.name);
                p._soc.emit("invited", invitation);
            }
        }
    }

    on_kick(data, ack) {
        var p = this._game.getClient(data);
        if(p) {
            this.log("Kicking ",p.name);
            p.leave();
            p._soc.emit("kicked");
        }
    }
    /*
    on_joinPlayer(data, ack) {
        var p = this._game.getClient(data);
        if(p) {
            this.log("Joining the game of ",p.name,"("+p._room.name+")");
            this.join(p._room.name);
        } else {
            this.error("Cannot join, invalid player id",data);
        }
    }
    */
    on_leave(data, ack) {
        this.leave();
        ack("left");
    }

    lateReady() {
        // tell everybody else
        this._soc.broadcast.emit("ready", {
            id: this.id,
            uuid: this.uuid,
            name: this.name
        });

        this._is_ready = true;
        this._game_status = Client.GAME_STATUS.PENDING;
    }

    on_ready(data, ack) {
        if( !this._room )
            return this.error("marked as ready but not in a room");
            
        this.lateReady();

        this._room.oneMoreReady();
    }

    on_frame(frame, ack) {
        if(this._replay)
            this._replay.frame(frame);

        if( !this._room )
            return this.error("received a frame but not in a room");

        this._room.playFrame(this, frame);
    }

    on_combos(frame, ack) {
        if(this._replay)
            this._replay.combo(frame);

        if( !this._room )
            return this.error("marked as ready but not in a room");
        
            this.log("Combos!");
        this._room.processHandicap(this, frame);
    }

    on_victory() {
        if( !this._room )
            return this.error("cannot grasp victory - not in a room");
        
        this.log("Victory");
        this._game_status = Client.GAME_STATUS.VICTORY;
        this._room.graspVictory(this);
    }

    on_defeat() {
        if( !this._room )
            return this.error("cannot announce defeat - not in a room");
        
        this.log("Defeated");
        this._game_status = Client.GAME_STATUS.DEFEAT;
        this._room.announceDefeat(this);
    }

    /*on_play_replay(path) {
        Replay.read(path)
            .on_frame((frame)=>{ this._soc.emit("frame-")
                
            })
    }*/
}

Client.GAME_STATUS = {
    PENDING: 1,
    VICTORY: 2, 
    DEFEAT : 3
};

module.exports = Client;
