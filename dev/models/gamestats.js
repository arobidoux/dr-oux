'use strict';

module.exports = (sequelize, DataTypes) => {
  const Gamestats = sequelize.define('Gamestats', {
    player_id: DataTypes.INTEGER,
    room_id: DataTypes.INTEGER,
    replay_uuid: DataTypes.STRING,
    virustotal: DataTypes.INTEGER,
    viruskilled: DataTypes.INTEGER,
    pillcount: DataTypes.INTEGER,
    endclutter: DataTypes.INTEGER,
  }, {
    getterMethods: {
      toObject() {
        var result = {
          id: this.id,
          virustotal : this.virustotal,
          viruskilled : this.viruskilled,
          pillcount : this.pillcount,
          endclutter : this.endclutter
        };

        if(this.Player) {
          result.player = this.Player.toObject;
        }
        
        return result;
      }
    }
  });
  Gamestats.associate = function(models) {
    // associations can be defined here
    Gamestats.belongsTo(models.Player, {foreignKey:'player_id'});
    Gamestats.belongsTo(models.Room, {foreignKey:'room_id'});
  };
  return Gamestats;
};