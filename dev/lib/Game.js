const Client = require("./Client");
const Room = require("./Room");

class Game {
    constructor(io) {
        this._io = io;
        this._clients = {};
        this._rooms = [];

        io.on("connection", function (socket) {
            new Client(socket, this);
        }.bind(this));
    }

    addClient(client) {
        this._clients[client.uuid] = client;
        this.sendUpdatedClients();
    }

    removeClient(client) {
        if(client.uuid && typeof(this._clients[client.uuid])) {
            delete(this._clients[client.uuid]);
            this.sendUpdatedClients();
        }
    }

    sendUpdatedClients() {
        var clients = [];
        for(var i=0;i<this._clients.length;i++)
            clients.push(this._clients[i].getDetails());
        
        this._io.emit("client_update",{clients:clients});
    }

    generateWelcomePackage() {
        return new Promise((resolve, reject) => {
            var rooms = [];
            for (var k in this._rooms)
                rooms.push(this._rooms[k].summary());

            var clients = [];
            for(var i=0;i<this._clients.length;i++)
                clients.push(this._clients[i].getDetails());

            resolve({
                rooms: rooms,
                clients: clients
            });
        });
    }

    getRoom(roomName) {
        if (typeof (this._rooms[roomName]) === "undefined")
            this._rooms[roomName] = new Room(roomName, this._io, this);

        return this._rooms[roomName];
    }

    removeRoom(roomName) {
        if (typeof (this._rooms[roomName]) !== "undefined")
            delete (this._rooms[roomName]);
    }
}

module.exports = Game;