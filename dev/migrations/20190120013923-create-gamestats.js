'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Gamestats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      player_id: {
        type: Sequelize.INTEGER
      },
      room_id: {
        type: Sequelize.INTEGER
      },
      virustotal: {
        type: Sequelize.INTEGER
      },
      viruskilled: {
        type: Sequelize.INTEGER
      },
      pillcount: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(() => {
      queryInterface.addIndex('Gamestats', ['player_id']);
      queryInterface.addIndex('Gamestats', ['room_id']);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Gamestats');
  }
};