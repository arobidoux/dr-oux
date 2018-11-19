const Client = require("./Client");
const Room = require("./Room");

class Game {
    constructor(io) {
        this._io = io;
        this._clients = [];
        this._rooms = [];

        io.on("connection", function(socket){
            this.addClient(new Client(socket, this));
        }.bind(this));
    }

    addClient( client ) {
        this._clients.push(client);
    }

    removeClient(client) {
        for(var i=0;i<this._clients.length;i++)
            if(this._clients[i]==client)
                return this._clients.splice(i,0);
    }

    generateWelcomePackage() {
        return new Promise((resolve, reject)=>{
            var rooms = [];
            for(var k in this._rooms)
                rooms.push(this._rooms[k].summary());

            resolve({
                rooms: rooms
            });
        });
    }

    getRoom(roomName) {
        if(typeof(this._rooms[roomName]) ==="undefined")
            this._rooms[roomName] = new Room(roomName, this._io);
        
        return this._rooms[roomName];
    }
}

module.exports = Game;