module.exports = (sequelize, DataTypes) => {
  const Response = sequelize.define('Response', {
    ResponseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    RequestId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ProfessionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    MasterId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    message: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'Responses',
    timestamps: true,
    schema: 'dbo' 
  });

  Response.associate = function(models) {
    Response.belongsTo(models.Request, { foreignKey: 'RequestId' });
    Response.belongsTo(models.Profession, { foreignKey: 'ProfessionId' });
    Response.belongsTo(models.Master, { foreignKey: 'MasterId' });
  };

  return Response;
};