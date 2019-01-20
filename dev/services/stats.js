const express = require("express");
const router = express.Router();

const db = require("../models/index");
const Op = db.Sequelize.Op;
const fn = db.Sequelize.fn;
const col = db.Sequelize.col;

var routes = {
    "/players": players,
    "/replays": replays
};

for(var url in routes)
    ((url, load)=>{
        router.get(url, async (req, res)=>{
            try {
                var result = await load(req, res);
                res.status(200);
                res.json(result);
            } catch(err) {
                console.error(err);
                res.status(500);
                res.json({
                    "error": true,
                    "message": err.toString()
                },500);
            }
            res.end();
        });
    })(url, routes[url]);



async function replays(req, res) {
    var options = {
        limit: 10,
        order: [
            ["startedat", "DESC"]
        ],
        include: [
            {association:"Winner"},
            {association:"Gamestats", include:[
                {association:"Player"}
            ]}
        ],
        distinct: true
    };

    var page = 1;
    if(req.query.page > 0) {
        options.offset = (req.query.page-1) * options.limit;
        page = req.query.page;
    }

    if(req.query.player) {
        addWhere(options, "Players", /^!?\d+$/.test(req.query.player) ? "id":"name", valueToFilter(req.query.player));
    }

    if(req.query.winner) {
        addWhere(options, "Winner", /^!?\d+$/.test(req.query.winner) ? "id":"name", valueToFilter(req.query.winner));
    }

    var rooms = await db.Room.findAndCountAll(options);
    var result = {
        page: page,
        lastpage: Math.ceil(rooms.count / options.limit),
        total: rooms.count,
        replays: rooms.rows.map((room)=>{
            return {
                id: room.id,
                startedat: room.startedat,
                winner: room.Winner ? room.Winner.toObject : null,
                stats: room.Gamestats.map((gamestat)=>{
                    return  gamestat.toObject;
                })
            };
        })
    };

    return result;
};

async function players (req, res) {
    var options = {
        attributes: [
            "id","name",
            [fn("count",col("Gamestats->Room.id")),"totalgamewon"],
            [fn("count",col("Gamestats.id")),"totalgameplayed"],
            [fn("sum",col("Gamestats.viruskilled")),"totalviruskilled"],
            [fn("sum",col("Gamestats.pillcount")),"totalpillused"]
        ],
        limit: 10,
        order: [
            [col("totalgamewon"), "DESC"]
        ],
        include: [
            {
                association:"Gamestats",
                attributes:[],
                include:[
                    {
                        association: "Room",
                        attributes:[],
                        required:false,
                        where:{
                            winner_id: {
                                [Op.eq]:col("Player.id")
                            }
                        }
                    }
                ]
            }
        ],
        group: ["Player.id","Player.name"],
        subQuery: false
    };

    var countOptions = {};

    var page = 1;
    if(req.query.page > 0) {
        options.offset = (req.query.page-1) * options.limit;
        page = req.query.page;
    }

    if(req.query.player) {
        addWhere(options, [], /^!?\d+$/.test(req.query.player) ? "id":"name", valueToFilter(req.query.player));
        addWhere(countOptions, [], /^!?\d+$/.test(req.query.player) ? "id":"name", valueToFilter(req.query.player));
    }

    var players = await db.Player.findAll(options);

    var count = await db.Player.count(countOptions);

    var result = {
        page: page,
        lastpage: Math.ceil(count / options.limit),
        total: count,
        players: players.map((player)=>{
            return {
                id: player.id,
                name: player.name,
                totalgamewon: player.get("totalgamewon"),
                totalgameplayed: player.get("totalgameplayed"),
                totalviruskilled: player.get("totalviruskilled"),
                totalpillused: player.get("totalpillused")
            };
        })
    };

    return result;
};



function valueToFilter(value) {
    if(value[0] == "!") {
        return {
            [Op.not] : value.substr(1)
        };
    }
    return value;
}

function addWhere(options, relations, field, value) {
    if(!(relations instanceof Array))
        relations = [relations];

    if(relations.length == 0) {
        if(typeof(options.where) === "undefined")
            options.where = {};
        
        options.where[field] = value;
    }
    else {
        var index = -1;
        var thisRelation = relations.shift();
        if(typeof(options.include) === "undefined") {
            options.include = [];
        }
        else {
            for(var i=0; i<options.include.length; i++) {
                if(options.include[i].association == thisRelation) {
                    index = i;
                    break;
                }
            }
        }

        if(index == -1) {
            index = options.include.length;
            options.include.push({ association: thisRelation });
        }
        
        addWhere(options.include[index], relations, field, value);
    }
}

module.exports = router;
