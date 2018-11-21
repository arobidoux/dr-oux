var nextClientID=1;

class Client {
    constructor(socket, game) {
        this._soc = socket;
        this._game = game;
        this._name = "Anonymous";
        this._room = null;
        this._id = nextClientID++;
        this._is_ready = false;

        this.log("New client connected");
        socket.on("error", (err) => { return this.error(err) });

        //socket.on("disconnecting", (reason) => { return this.on_disconnecting(reason) });
        socket.on("disconnect", (reason) => { return this.on_disconnect(reason) });

        socket.on("authenticate", (data, ack) => { return this.on_authenticate(data, ack) });
        socket.on("join", (data, ack) => { return this.on_join(data, ack) });
        socket.on("leave", (data, ack) => { return this.on_leave(data, ack) });
        socket.on("ready", (data, ack) => { return this.on_ready(data, ack) });
        socket.on("frame", (data, ack) => { return this.on_frame(data, ack) });
        socket.on("victory", (data, ack) => { return this.on_victory(data, ack) });
        socket.on("combos", (data, ack) => { return this.on_combos(data, ack) });
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

    getDetails() {
        return {
            name: this._name,
            ready: this._ready,
            id: this._id
        }
    }

    log(...msg) {
        // TODO look to format object better
        console.log("[" + this._name + "]" + msg.join(" "));
    }

    error(...msg) {
        // TODO look to format object better
        console.error("[" + this._name + "]" + msg.join(" "));
    }

    leave() {
        if (this._room) {
            this.log("Left the room", this._room.name);
            this._room.removeClient(this);
            this._room = null;
        }
        else {
            this.log("Cannot leave, no room assigned");
        }
    }

    reset() {
        this._is_ready = false;
    }

    on_disconnect(reason) {
        this._game.removeClient(this);
        this.leave();
        this.log("Disconnected: " + reason);
    }

    on_authenticate(data, ack) {
        this._name = data.name;
        this._game.generateWelcomePackage()
            .then(ack, ack.bind(null, { error: "Failled to generate welcome package" }));
    }

    on_join(data, ack) {
        this.leave();
        this._room = this._game.getRoom(data.room, this);
        this._room.addClient(this);

        this._soc.join(data.room);

        this.log("Joined room " + data.room);

        this._room.generateDetails()
            .then(ack, (err)=>{
                ack({
                    error: "Failled to retrieve room details",
                    err: {
                        msg: err.message
                    }
                });
            });
    }

    on_leave(data, ack) {
        this.leave();
        ack("left");
    }

    on_ready(data, ack) {
        if( !this._room )
            return this.error("marked as ready but not in a room");
            
        // tell everybody else
        this._soc.to(this._room.name).emit("ready", {
            id: this.id,
            name: this.name
        });

        this._is_ready = true;

        this._room.oneMoreReady();
    }

    on_frame(frame, ack) {
        if( !this._room )
            return this.error("received a frame but not in a room");
            
        // tell everybody else
        this._soc.to(this._room.name).emit("frame-"+this._id, frame);
    }

    on_combo(frame, ack) {
        this._room.processHandicap(this, frame);
    }

    on_victory() {
        this._room.graspVictory(this);
    }
}

module.exports = Client;
