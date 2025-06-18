const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Profession = sequelize.define('Profession', {
        ProfessionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ProfessionName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'Profession',
        timestamps: false,
        freezeTableName: true,
        schema: 'dbo'
    });

    Profession.associate = (models) => {
        Profession.hasMany(models.masters, {
            foreignKey: 'ProfessionId',
            as: 'masters'
        });
        Profession.hasMany(models.responses, {
            foreignKey: 'ProfessionId',
            as: 'responses'
        });
    };

    return Profession;
}; 