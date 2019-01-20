const fs = require("fs");

const path = require("path");
const util = require("util");
const spawn = require("child_process").spawn;
const readFile = util.promisify(fs.readFile);

const config = require("../../config");
const db = require("../../models/index");
const analyze_bin_path = path.resolve(
    process.platform === "win32" ?
    "../analyze/analyze.exe" :
    "../analyze/analyze"
);

const Channel = require("../../utils/Channel");

var dbChannel = new Channel(1, async (cb)=>{ return await cb(); });

async function analyzeGame(game_uuid, force_rescan) {
    // look if it already exists in the database
    var room = await dbChannel.push(()=>{ 
        return db.Room.findOrCreate({
            where:{uuid:game_uuid}
        }).spread((room, created)=>{ return room; });
    });

    if(room.startedat != null && force_rescan !== true) {
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
                    var nextGame = await dbChannel.push(()=>{ 
                        return db.Room.findOrCreate({where:{uuid:match[2]}})
                        .spread((room, created)=>{ return room; });
                    });
                    room.next_id = nextGame.id;
                    nextGame.prev_id = room.id;
                    await dbChannel.push(()=>{ 
                        return nextGame.save();
                    });
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
                var player = await dbChannel.push(()=>{ 
                    return db.Player.findOrCreate({
                        where: {name:player_match[2]}
                    }).spread((player, created)=>{ return player; });
                });

                players[player_match[1]] = player;
                continue;
            }
        }

        // skipping line..
        if(lines[i]) {
            console.log(`skipping line ${lines[i]}`);
        }
    }

    // save the room object
    await dbChannel.push(()=>{ 
        return room.save();
    });

    var promises = [];
    for(var player_uuid in players) {
        promises.push(
            processPlayer(room, player_uuid, players[player_uuid])
        );
    }
    
    await Promise.all(promises);

    // done!
    return 0;
}

async function processPlayer(room, player_uuid, player) {
    // save the player object
    await dbChannel.push(()=>{
        return player.save();
    });
    
    // create the gamestats object
    var gamestats = await dbChannel.push(()=>{
        return db.Gamestats.findOrCreate({
            where: {
                replay_uuid: player_uuid,
                room_id: room.id,
                player_id: player.id
            }
        }).spread((gamestats, created)=> { return gamestats });
    });
    
    // process analisis of the replay
    try {
        var stats = await analyze(room.uuid, gamestats.replay_uuid);
    } catch(e) {
        console.error(e);
        return;
    }
    
    gamestats.pillcount = stats.Pillcount;
    gamestats.virustotal = stats.Virustotalcount;
    gamestats.viruskilled = stats.Viruskillcount;
    
    // save gamestats
    await dbChannel.push(()=>{
        return gamestats.save();
    });
}
    
async function analyze(room_uuid, player_uuid) {
    var stdout = await new Promise((resolve, reject)=>{
        var stdout = "";
        var prc = spawn(analyze_bin_path,  ["-json", "-f", path.join(config.storage.replay,room_uuid, player_uuid)]);
        
        prc.stdout.setEncoding("utf8");
        prc.stdout.on("data", function (data) {
            stdout += data.toString();
        });

        prc.stderr.setEncoding("utf8");
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

module.exports = analyzeGame;
