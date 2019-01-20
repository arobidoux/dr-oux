const workerCount = 5;

var game_uuid = null;
var force_rescan = false;
var analyze_all = false;

for(var i=2; i < process.argv.length; i++) {
    switch(process.argv[i]) {
        case "-f": case "--force":
            force_rescan = true;
            break;
        case "-a": case "--all":
            analyze_all = true;
            break;
        default:
            if(process.argv[i][0] == "-") {
                console.error(`Unkown option ${process.argv[i]}`);
            }
            else {
                game_uuid = process.argv[i];
            }
    }
}

if( game_uuid == null && !analyze_all ) {
    console.error("Please specify game uuid as argument, or use the --all flag");
    process.exit(1);
}

const fs = require("fs");

const analyzeGame = require("./lib/analyzeGame");
const db = require("../models/index");
const config = require("../config");
const Handler = require("../utils/Handler");

function now() {
    return (new Date()).getTime();
}

console.time("Processed In");
if(analyze_all) {
    console.log("Loading all games...");
    
    fs.readdir(config.storage.replay, (err,games)=>{
        if(err) {
            console.error(err);
            process.exit(1);
        }

        //games = games.slice(0,25);

        var totalgame = games.length;
        var processed = 0;
        var processTime = [];
        console.log(`${games.length} games found`);
        Handler.processWithPool(
            ()=>{
                if( games.length == 0) {
                    console.log(`Returning null - killing worker`);
                    return null;
                }

                console.log(`Processing game ${++processed} / ${totalgame}`);
                return games.shift();
            },
            async (game_uuid) => {
                var started = now();
                await analyzeGame(game_uuid, force_rescan);
                processTime.push(now()-started);
            }, 
            workerCount
        ).then((done)=>{
            console.log(`processing of ${done} item completed`);
            console.timeEnd("Processed In");

            var avg = 0;
            var l = processTime.length;
            for(var i=0; i<l; i++)
                avg += processTime[i];
            avg /= l;

            console.log(`Average process time of ${avg}ms`);
            db.sequelize.close();
            
        });
    });
}
else {
    analyzeGame(game_uuid, force_rescan).then(()=>{
        console.log("Complete");
        console.timeEnd("Processed In");
        db.sequelize.close();
    });
}
