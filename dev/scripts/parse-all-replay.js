const fs = require("fs");
const path = require("path");
const util = require("util");
const spawn = require("child_process").spawn;
const db = require("../models/index");
const config = require("../config");

const readFile = util.promisify(fs.readFile);

const analyze_bin_path = path.resolve("../analyze/analyze.exe");
const workerCount = 1;

console.log("Loading games...");
fs.readdir(config.storage.replay, (err,games)=>{
    if(err) {
        console.error(err);
        process.exit(1);
    }

    var totalgame = games.length;
    var processed = 0;
    console.log(`${games.length} games found`);
    function provide() {
        console.log(`Processing game ${++processed} / ${totalgame}`);
        return games.length == 0 ? null : games.shift();
    }

    var workers = [];
    for( var i=0; i<workerCount; i++) {
        var h = new Handler(provide);
        workers.push(h.done_promise);
    }

    Promise.all(workers).then(()=>{
        console.log("processing completed");
        db.sequelize.close();
    });
});

class Handler {
    constructor(next) {
        this._next = next;
        this._done_count = 0;

        this.done_promise = new Promise((resolve, reject)=>{
            this._resolve = resolve;
            this._reject = reject;
            this._processNext();
        });
    }

    async _processNext() {
        var elem = this._next();
        if(elem == null) {
            this._resolve(this._done_count);
            return;
        }

        try {
            switch(await this._process(elem)) {
                case 0:
                    this._done_count++;
                    break;
                case 1:
                    // already processed
                    break;
            }
            
        } catch(e) {
            console.error(`Error while processing ${elem}`);
            console.error(e);
        }

        // call next on next iteration
        setTimeout(()=>{this._processNext()});
    }

    async _process(game_uuid) {
        // look if it already exists in the database
        var room = await db.Room.findOrCreate({
            where:{uuid:game_uuid}
        }).spread((room, created)=>{ return room; });

        if(room.startedat != null) {
            console.log(`Skipping completed game ${game_uuid}`)
            return 1;
        }

        var content = await readFile(path.join(config.storage.replay, game_uuid, "meta"));
                
        var lines = content.toString("utf8").split("\n");
        var players = null;

        for(var i=0;i<lines.length;i++) {
            if(lines[i] == "players") {
                players = {};
                continue;
            }
            
            var match = lines[i].match(/^(started|Victory|end|next-game|previous-game)[: ]*(.+)$/);
            if(match) {
                switch(match[1]) {
                    case "started": room.startedat = match[2]; break;
                    case "end": room.endedat = match[2]; break;
                    case "previous-game":
                        // shouldn't be needed
                        break;
                    case "next-game":
                        var nextGame = await db.Room.findOrCreate({where:{uuid:match[2]}})
                            .spread((room, created)=>{ return room; });
                        room.next_id = nextGame.id;
                        nextGame.prev_id = room.id;
                        await nextGame.save();
                        break;
                    case "Victory":
                        if(typeof(players[match[2]]) === "undefined") {
                            console.error(`couldn't retrieve Victorious player for game ${game_uuid}`);
                        }
                        else {
                            room.winner_id = players[match[2]].id;
                        }
                        break;
                }
                continue;
            }

            else if(players !== null) {
                var player_match = lines[i].match(/^([a-f0-9-]+) (.+)$/);
                if(player_match) {
                    var player = await db.Player.findOrCreate({
                        where: {uuid:player_match[1]},
                        defaults: {name:player_match[2]}
                    }).spread((player, created)=>{ return player; });

                    players[player.uuid] = player;
                    continue;
                }
            }

            // skipping line..
            if(lines[i]) {
                console.log(`skipping line ${lines[i]}`);
            }
        }

        // save the room object
        await room.save();

        for(var player_uuid in players) {
            // save the player object
            await players[player_uuid].save();

            // process analisis of the replay
            var stats = await analyze(game_uuid, player_uuid);
            
            // create the gamestats object
            var gamestats = await db.Gamestats.create({
                pillcount: stats.Pillcount,
                virustotal: stats.Virustotalcount,
                viruskilled: stats.Viruskillcount   
            });

            // assign gamestats to player and room
            gamestats.setPlayer(players[player_uuid]);
            gamestats.setRoom(room);

            // save gamestats
            await gamestats.save();
        }
        
        // done!
        return 0;
    }
}

async function analyze(room_uuid, player_uuid) {
    var stdout = await new Promise((resolve, reject)=>{
        var stdout = "";
        var prc = spawn(analyze_bin_path,  ["-json", "-f", path.join(config.storage.replay,room_uuid, player_uuid)]);
        
        prc.stdout.setEncoding("utf8");
        prc.stdout.on("data", function (data) {
            stdout += data.toString();
        });

        prc.stderr.on("data", function (data) {
            console.error(data.toString());
        });
        
        prc.on("close", function (code) {
            if(code != 0) {
                reject(`analyze returned err code ${code}`);
            }
            resolve(stdout);
        });
    });

    return JSON.parse(stdout);
}