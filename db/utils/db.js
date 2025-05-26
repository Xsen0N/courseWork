const { initModels } = require('../models/initModels');
const { Sequelize } = require("sequelize");

const connection = new Sequelize('CourseW', 'sa', 'P@ssw0rd!', {
    host: 'db',
    dialect: 'mssql',
    port: 1433,
    pool: {
        min: 0,
        max: 10
    },
    dialectOptions: {
        options: {
            encrypt: false,
        },
    },
});

const models = initModels(connection);

module.exports = { models, connection };

connection.sync({ alter: false, force: false })
  .then(() => {
    console.log('Database synchronized successfully.');
  })
  .catch(err => {
    console.error('Unable to synchronize the database:', err);
  });

connection
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });