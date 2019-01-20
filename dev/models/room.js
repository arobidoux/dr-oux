'use strict';
module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    uuid: DataTypes.STRING,
    name: DataTypes.STRING,
    prev_id: DataTypes.INTEGER,
    next_id: DataTypes.INTEGER,
    winner_id: DataTypes.INTEGER,
    startedat: DataTypes.DATE,
    endedat: DataTypes.DATE,
  }, {});
  Room.associate = function(models) {
    // associations can be defined here
    Room.hasMany(models.Gamestats, {foreignKey:'room_id'});
    Room.belongsToMany(models.Player, {through:'gamestats', foreignKey:'room_id', otherKey:'player_id'});
    Room.belongsTo(models.Player, {as:"Winner", foreignKey:'winner_id'});
    Room.belongsTo(models.Room, {as:"NextRoom", foreignKey:'next_id'});
    Room.belongsTo(models.Room, {as:"prevRoom", foreignKey:'prev_id'});
  };
  return Room;
};