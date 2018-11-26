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

    log(...msg) {
        // TODO look to format object better
        console.log("[GAME]" + msg.join(" "));
    }

    addClient(client) {
        this._clients[client.uuid] = client;

        this.log(`Client ${client.uuid} added, name: ${client.name}`);
        this.sendUpdatedClients();

        // send current room to the client
        var rooms = [];
        for(var k in this._rooms)
            rooms.push(this._rooms[k].summary());

        client._soc.emit("room_list",{
            rooms:rooms
        });
    }

    removeClient(client) {
        if(client.uuid && typeof(this._clients[client.uuid])) {
            delete(this._clients[client.uuid]);
            this.sendUpdatedClients();
        }
    }

    getClient(uuid) {
        return this._clients[uuid];
    }

    sendUpdatedClients() {
        var clients = [];
        for(var k in this._clients)
            clients.push(this._clients[k].getDetails());
        
        this._io.emit("client_update",{clients:clients});
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