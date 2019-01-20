const path = require("path");

var config = {
    env: process.env.NODE_ENV || 'development',
    storage_root: path.resolve(process.env.STORAGE || "../storage"),
    port: process.env.PORT || 8080,
    storage: function(p) {
        return path.resolve(config.storage_root, p);
    }
};

config.storage.replay = config.storage("replay");
config.storage.sqlite = {
    stats: {
        dev: config.storage("stats-dev.sqlite"),
        prod: config.storage("stats.sqlite")
    }
};

module.exports = config;
