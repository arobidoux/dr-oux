const path = require("path");
const express = require("express");
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const Game = require("./lib/Game");

const port = 8080;


app.get("/", (req, res) => {
    res.sendFile(path.resolve("../assets/html/index.html"));
});
app.get("/index.html", (req, res) => {
    res.sendFile(path.resolve("../assets/html/index.html"));
});
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.resolve("../assets/img/favicon.ico"));
});

app.use("/assets",express.static(path.resolve("../assets")));

app.use("/assets/uuid/",express.static(path.resolve("node_modules/uuid-browser")));

var game = new Game(io);

http.listen(port, () => console.log(`DrMario listening on port ${port}!`));
