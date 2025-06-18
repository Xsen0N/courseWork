module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Types', {
      TypeId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true 
      },
      TypeName: {
          type: DataTypes.STRING(1000),
          allowNull: false
      },
      Description: {
          type: DataTypes.STRING(1000), 
          allowNull: true 
      }
  }, {
      sequelize,
      tableName: 'Types',
      timestamps: false
  });
};
