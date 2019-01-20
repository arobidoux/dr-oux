const config = require("../config.js");

module.exports = {
  "development": {
    "username": "",
    "password": "",
    "database": "database_development",
    "dialect": "sqlite",
    "storage": config.storage.sqlite.stats.dev,
    "operatorsAliases": false,
    "migrationStorage": "sequelize",
    logging: false
  },
  "test": {
    "username": "",
    "password": "",
    "database": "database_test",
    "dialect": "sqlite",
    "operatorsAliases": false,
    "migrationStorage": "none",
    logging: false
  },
  "production": {
    "username": "",
    "password": "",
    "database": "database_production",
    "storage": config.storage.sqlite.stats.prod,
    "operatorsAliases": false,
    "migrationStorage": "sequelize",
    logging: false
  }
};
