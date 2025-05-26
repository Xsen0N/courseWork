// models/requestCriterias.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RequestCriterias', {
    RequestId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Requests',
        key: 'RequestId'
      }
    },
    CriteriasId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Criterias',
        key: 'CriteriasId'
      }
    }
  }, {
    tableName: 'RequestCriterias',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['RequestId', 'CriteriasId']
      }
    ]
  });
};