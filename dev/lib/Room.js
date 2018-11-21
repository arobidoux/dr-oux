class Room {
    constructor(name, io, game) {
        this._name = name;
        this._io = io;
        this._game = game;
        this._clients = [];
        this._gameInProgress = false;

        this._io.emit("room_created", this.summary());
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

        //console.log("[Room::" + this._name + "] no matching client for id " + client.id);
    }

    oneMoreReady() {
        if(this._gameInProgress)
            return false;
        
        var summary = this.summary();
        this._io.emit("room_updated", summary);

        if(summary.clientCount > summary.clientReady)
            return false;
        
        this.launchGame();
    }

    launchGame() {
        if(this._gameInProgress)
            return;
        
        this._gameInProgress = true;

        // countdown
        this.countDown(5);
    }

    countDown(sec) {
        if(sec) {
            this._io.in(this._name).emit("countdown", {sec:sec});
            setTimeout(this.countDown.bind(this, sec-1), 1000);
        }
        else {
            this.startGame();
        }
    }

    startGame() {
        this._io.in(this._name).emit("start");
    }

    
    processHandicap(client, frame) {
        client._soc.to(this._name).emit("handicap", frame);
    }

    graspVictory(client) {
        client._soc.to(this._name).emit("gameover", {winner:client.getDetails()});
        this.reset();
    }

    reset() {
        this._gameInProgress = false;
        for(var i=0;i< this._clients.length; i++)
            this._clients[i].reset();
    }
}

module.exports = Room;