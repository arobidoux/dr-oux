const path = require("path");
const express = require("express");
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const Game = require("./lib/Game");

const port = process.env.PORT || 8080;

function serveIndex(req, res) {
    var isIos = /Mac OS X/.test(req.headers['user-agent']);
    if(isIos) {
        return res.sendFile(path.resolve("../assets/html/index-ios.html"));
    }
    else {
        return res.sendFile(path.resolve("../assets/html/index.html"));
    }
}

app.get("/", serveIndex);
app.get("/index.html", serveIndex);
app.get("/index-ios.html", serveIndex);


app.get("/sw.js", (req, res) => {
    res.sendFile(path.resolve("../assets/manifest/service-worker.js"));
});

app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.resolve("../assets/img/favicon.ico"));
});

app.use(
    "/assets",
    //(req,res,next)=>{console.log(req.originalUrl); next();},
    express.static(path.resolve("../assets"))
);

app.use("/assets/uuid/",express.static(path.resolve("node_modules/uuid-browser")));

var game = new Game(io);

http.listen(port, () => console.log(`DrMario listening on port ${port}!`));
