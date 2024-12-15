module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Services', {
      ServiceId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      TypeId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      Description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      Location: { 
        type: DataTypes.STRING(255),  
        allowNull: false
      },
      MasterId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, {
      sequelize,
      tableName: 'Services',
      timestamps: false
    });
  };
  