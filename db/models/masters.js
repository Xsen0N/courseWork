module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Master', {
      MasterId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Name: {
        type: DataTypes.STRING(80),
        allowNull: false
      },
      Login: {
          type: DataTypes.STRING(50),
          allowNull: false
      },
      Password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      Photo: {
        type: DataTypes.BLOB('long'),
        allowNull: true
      },
      Description: {
        type: DataTypes.STRING,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'Master',
      timestamps: false
    });
  };
  