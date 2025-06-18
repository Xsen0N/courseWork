module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Requests', {
        RequestId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        UserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'ID'
            }
        },
        TypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Types',
                key: 'TypeId'
            }
        },
        ServiceCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        },
        Date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        Location: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        Address: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        Comments: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        Status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['pending', 'in_progress', 'completed', 'cancelled']]
            }
        }
    }, {
        sequelize,
        tableName: 'Requests',
        timestamps: true,
        indexes: [
            {
                fields: ['UserId']
            },
            {
                fields: ['TypeId']
            },
            {
                fields: ['Status']
            },
            {
                fields: ['Date']
            }
        ],
        hooks: {
            beforeCreate: (request) => {
                if (!request.Status) {
                    request.Status = 'pending';
                }
                if (!request.ServiceCount) {
                    request.ServiceCount = 1;
                }
            }
        }
    });
};
  