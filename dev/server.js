const config = require("./config");
const path = require("path");
const express = require("express");
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const Game = require("./lib/Game");


if(process.env.ENV == "DEV") {
    process.once("SIGUSR2", function () {
        console.log("Terminating http server");
        http.close();
        process.kill(process.pid, "SIGUSR2");
    });
    
    // Development code, will automatically package the javascript upon saving
    const child_process = require("child_process");
    var package = child_process.exec("npm run package", (error, stdout, stderr) => {
        if(error)
            console.error("[PACKAGE] Error: " + err);
    });

    package.stdout.on("data", (data) => {
        console.log("[PACKAGE] " + data);
    });

    package.stderr.on("data", (data) => {
        console.error("[PACKAGE] " + data);
    });

    package.on("close", (code) => {
        console.log("[PACKAGE] exited with code " + code);
    });
}

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

app.get("/sw-ios.js", (req, res) => {
    res.sendFile(path.resolve("../assets/manifest/service-worker-ios.js"));
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

http.listen(config.port, () => console.log(`DrMario listening on port ${config.port}!`));
