module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RequestProfessions', {
    RequestId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Requests',
        key: 'RequestId',
        onDelete: 'CASCADE'
      }
    },
    ProfessionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Professions', 
        key: 'ProfessionId',
        onDelete: 'CASCADE'
      }
    },
    required: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    approved: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: function() {
          return this.required;
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'partially_approved', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'RequestProfessions',
    timestamps: false, // Отключаем автоматические createdAt/updatedAt
    indexes: [
      {
        unique: true,
        fields: ['RequestId', 'ProfessionId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['ProfessionId']
      }
    ],
    hooks: {
      beforeUpdate: (instance) => {
        instance.updatedAt = new Date();
      }
    }
  });
};