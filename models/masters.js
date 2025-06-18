const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Master = sequelize.define('Master', {
        MasterId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ProfessionId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Profession',
                key: 'ProfessionId'
            }
        },
        Name: {
            type: DataTypes.STRING(1000),
            allowNull: false
        },
        Login: {
            type: DataTypes.STRING(1000),
            allowNull: false
        },
        Password: {
            type: DataTypes.STRING(60),
            allowNull: false
        },
        Photo: {
            type: DataTypes.BLOB,
            allowNull: true
        },
        Description: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        PriceForHour: {
            type: DataTypes.DOUBLE,
            allowNull: true
        }
    }, {
        tableName: 'Master',
        timestamps: false,
        freezeTableName: true,
        schema: 'dbo'
    });

    Master.associate = (models) => {
        Master.belongsTo(models.professions, {
            foreignKey: 'ProfessionId',
            as: 'Profession'
        });
        Master.hasMany(models.responses, {
            foreignKey: 'MasterId',
            as: 'responses'
        });
    };

    return Master;
}; 