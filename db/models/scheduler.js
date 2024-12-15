module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Scheduler', {
      SchedulerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      EnrollmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      ApprovedTime: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, {
      sequelize,
      tableName: 'Scheduler',
      timestamps: false
    });
  };
  