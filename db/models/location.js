module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Location', {
        LocationId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },
        LocationName: {
            type: DataTypes.STRING(1000),
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'Location',
        timestamps: false
    });
  };