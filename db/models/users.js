module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Users', {
      ID: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
      },
      Login: {
          type: DataTypes.STRING(50),
          allowNull: false
      },
      Email: {
          type: DataTypes.STRING, // Предположим, что электронная почта должна быть строкой
          allowNull: false
      },
      Role: {
          type: DataTypes.INTEGER,
          allowNull: false
      },
      Password: {
          type: DataTypes.STRING,
          allowNull: false
      }
  }, {
      sequelize,
      tableName: 'Users',
      timestamps: false
  });
};
