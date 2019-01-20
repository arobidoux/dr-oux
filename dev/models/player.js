'use strict';
module.exports = (sequelize, DataTypes) => {
  const Player = sequelize.define('Player', {
    name: DataTypes.STRING
  }, {
    getterMethods: {
      toObject() {
        return {
          id: this.id,
          name: this.name
        };
      }
    }
  });
  Player.associate = function(models) {
    // associations can be defined here
    Player.hasMany(models.Gamestats, {foreignKey:'player_id'});
    Player.belongsToMany(models.Room, {through:'gamestats', foreignKey:'player_id', otherKey:'room_id'});
    Player.hasMany(models.Room, {as:"Gamewon", foreignKey:'winner_id'});
  };
  return Player;
};