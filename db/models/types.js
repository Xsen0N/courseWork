module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Type', {
      TypeId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true 
      },
      TypeName: {
          type: DataTypes.STRING(100),
          allowNull: false
      },
      Description: {
          type: DataTypes.STRING(255), 
          allowNull: true 
      }
  }, {
      sequelize,
      tableName: 'Types',
      timestamps: false
  });
};
