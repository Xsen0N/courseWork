module.exports = (sequelize, DataTypes) => {
    const Response = sequelize.define('Response', {
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
                key: 'RequestId'
            }
        },
        ProfessionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Profession',
                key: 'ProfessionId'
            }
        },
        MasterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Masters',
                key: 'MasterId'
            }
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'accepted', 'rejected']]
            }
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'Responses',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    Response.associate = (models) => {
        Response.belongsTo(models.requests, {
            foreignKey: 'RequestId',
            as: 'request'
        });
        Response.belongsTo(models.professions, {
            foreignKey: 'ProfessionId',
            as: 'profession'
        });
        Response.belongsTo(models.masters, {
            foreignKey: 'MasterId',
            as: 'master'
        });
    };

    return Response;
}; 