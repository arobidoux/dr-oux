const path = require("path");

var config = module.exports = {
    storage_root: path.resolve(process.env.STORAGE || "../storage"),
    port: process.env.PORT || 8080,
    storage: function(path) {
        return path.resolve(config.storage_root, path);
    }
};
