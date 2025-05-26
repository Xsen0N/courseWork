module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Profession', {
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
        tableName: 'Profession',
        timestamps: false
    });
  };
  