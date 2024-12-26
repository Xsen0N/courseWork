const { initModels } = require('../models/initModels');
const {  DataTypes } = require('sequelize');
const  { Sequelize } = require("sequelize");


const connection = new Sequelize('CourseW', 'sa', '1111', {
    host: 'localhost',
    dialect: 'mssql',
    port: 1433,
    pool: {
        min: 0,
        max: 10
    }, dialectOptions: {
      options: {
        encrypt: false, // Попробуйте отключить шифрование, если используется локальная база
      },
    },
});

const models = initModels(connection);

module.exports = { models, connection };

connection.sync({ alter: false }) // Use { force: true } to drop existing tables and re-create them , force: true
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