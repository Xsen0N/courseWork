module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Enrollment', {
      EnrollmentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ServiceId: {
        type: DataTypes.INTEGER, 
        allowNull: false
      },
      UserId: {
        type: DataTypes.INTEGER, 
        allowNull: false
      },
      Status: {  // Статус заявки (например, "на рассмотрении", "подтверждено", "отказано")
        type: DataTypes.INTEGER,
        allowNull: false
      },
      Date: {  
        type: DataTypes.DATEONLY,  
        allowNull: false
      },
      Time: {  
        type: DataTypes.TIME,  
        allowNull: false
      },
      Duration: {  
        type: DataTypes.INTEGER,  
        allowNull: false
      },
      Address:{
        type: DataTypes.STRING(1000),  
        allowNull: false
      },
      Comments: { 
        type: DataTypes.STRING(1000),  
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'Enrollment',
      timestamps: false
    });
  };
  