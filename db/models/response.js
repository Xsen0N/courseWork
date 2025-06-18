module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Response', {
    ResponseId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    RequestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Requests',
        key: 'RequestId',
        schema: 'dbo'
      }
    },
    ProfessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Professions',
        key: 'ProfessionId',
        schema: 'dbo'
      }
    },
    MasterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Master',
        key: 'MasterId',
        schema: 'dbo'
      }
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
    schema: 'dbo',
    timestamps: true,
    indexes: [
      {
        fields: ['RequestId']
      },
      {
        fields: ['ProfessionId']
      },
      {
        fields: ['MasterId']
      }
    ]
  });
};