const config = require("./config");
const path = require("path");
const express = require("express");
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

const Game = require("./lib/Game");

var game = new Game(io);
// queue server listen after configuration
setTimeout(()=>{
    http.listen(config.port, () => console.log(`DrMario listening on port ${config.port}!`));
});

function serveIndex(req, res) {
    var isIos = /Mac OS X/.test(req.headers['user-agent']);
    if(isIos) {
        return res.sendFile(path.resolve("../assets/html/index-ios.html"));
    }
    else {
        return res.sendFile(path.resolve("../assets/html/index.html"));
    }
}

// enable logs
//app.use((req,res,next)=>{console.log(req.originalUrl); next();});

app.get("/", serveIndex);
app.get("/index.html", serveIndex);
app.get("/index-ios.html", serveIndex);

// static file
var staticMap = {
    "/sw.js": path.resolve("../assets/manifest/service-worker.js"),
    "/sw-ios.js": path.resolve("../assets/manifest/service-worker-ios.js"),
    "/favicon.ico": path.resolve("../assets/img/favicon.ico")
};
for(var url in staticMap)
    ((url, file_path)=>{
        app.get(url, (req, res) => { res.sendFile(file_path); })
    })(url, staticMap[url]);

// static paths
app.use( "/assets", express.static(path.resolve("../assets")));
app.use( "/assets/uuid/", express.static(path.resolve("node_modules/uuid-browser")));

// stats
app.use("/stats", require("./services/stats"));

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
