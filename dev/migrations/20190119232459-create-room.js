'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Rooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uuid: {
        type: Sequelize.STRING
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING
      },
      prev_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      next_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      winner_id: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      startedat: {
        allowNull: true,
        type: Sequelize.DATE
      },
      endedat: {
        allowNull: true,
        type: Sequelize.DATE
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
      queryInterface.addIndex('Rooms', ['uuid'])
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Rooms');
  }
};