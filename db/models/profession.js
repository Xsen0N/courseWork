module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Professions', {
        ProfessionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },
        ProfessionName: { 
            type: DataTypes.STRING(1000),
            allowNull: false
        },
        Description: {
            type: DataTypes.STRING(1000), 
            allowNull: true 
        }
    }, {
        sequelize,
        tableName: 'Professions',
        schema: 'dbo',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['ProfessionName']
            }
        ]
    });
};
  