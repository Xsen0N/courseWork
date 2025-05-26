module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Criterias', {
    CriteriasId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Name: {  
        type: DataTypes.STRING(1000),
        allowNull: false
      },
      Description: {
        type: DataTypes.STRING(1000),  
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'Criterias',
      timestamps: false
    });
};