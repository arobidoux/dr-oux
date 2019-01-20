'use strict';
module.exports = (sequelize, DataTypes) => {
  const Gamestats = sequelize.define('Gamestats', {
    player_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    virustotal: DataTypes.INTEGER,
    viruskilled: DataTypes.INTEGER,
    pillcount: DataTypes.INTEGER
  }, {});
  Gamestats.associate = function(models) {
    // associations can be defined here
    Gamestats.belongsTo(models.Player, {foreignKey:'player_id'});
    Gamestats.belongsTo(models.Room, {foreignKey:'room_id'});
  };
  return Gamestats;
};