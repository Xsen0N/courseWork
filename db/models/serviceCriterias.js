// models/serviceCriterias.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ServiceCriterias', {
    ServiceId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: 'Services', key: 'ServiceId' }
    },
    CriteriasId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: 'Criterias', key: 'CriteriasId' }
    }
  }, {
    tableName: 'ServiceCriterias',
    timestamps: false,
    underscored: false,
    freezeTableName: true // Важно для MSSQL
  });
};