class Room {
    constructor(name, io) {
        this._name = name;
        this._io = io;
        this._clients = [];
        this._gameInProgress = false;
    }

    get name() {
        return this._name;
    }

    /**
     * return a summary to the client
     */
    summary() {
        return {
            name: this._name,
            clientCount: this._clients.length,
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
    }
    
    removeClient(client) {
        for(var i=0; i<this._clients;i++)
            if(this._clients[i] == client)
                return this._clients.splice(i,1);
    }

    oneMoreReady() {
        if(this._gameInProgress)
            return false;

        for(var i=0;i<this._clients.length; i++)
            if(!this._clients[i].ready)
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