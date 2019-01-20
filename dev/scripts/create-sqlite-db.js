const fs = require("fs");
const sqlite = require("sqlite3");

const config = require("../config");
const sequelize_config = require("../config/config");

if(typeof(sequelize_config[config.env]) === "undefined") {
    console.error(`Undefined configuration for environment ${config.env}`);
    process.exit(1);
}

if(sequelize_config[config.env].dialect !== "sqlite") {
    console.error(`invalid dialect ${sequelize_config[config.env].dialect}, please use the sequelize-cli db:create command`);
    process.exit(1);
}

if(typeof(sequelize_config[config.env].storage) === "undefined") {
    console.error(`Undefined storage for environment ${config.env}`);
    process.exit(1);
}

var dbpath = sequelize_config[config.env].storage;

fs.stat(dbpath, (err, stats)=>{
    if(err && err.code != "ENOENT") {
        console.error(err);
        process.exit(1);
    }

    if(!err && stats && stats.isFile()) {
        console.log(`database already exists at ${dbpath}`);
        process.exit(0);
    }

    console.log(`Creating sqlite database to ${dbpath}`);
    const db = new sqlite.Database(dbpath,(err)=>{
        if(err) {
            console.error(err);
            process.exit(1);
        }

        db.close();
        console.log("done");
    });
});
