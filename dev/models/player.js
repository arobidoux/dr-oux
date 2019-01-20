'use strict';
module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define('Player', {
    uuid: DataTypes.STRING,
    name: DataTypes.STRING
  }, {});
  Player.associate = function(models) {
    // associations can be defined here
    Player.hasMany(models.Gamestats, {foreignKey:'player_id'});
    Player.belongsToMany(models.Room, {through:'gamestats', foreignKey:'room_id', otherKey:'player_id'});
  };
  return Player;
};