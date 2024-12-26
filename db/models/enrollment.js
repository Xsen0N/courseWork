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
      Date: {  // Дата (без времени)
        type: DataTypes.DATEONLY,  // Используем DATEONLY для хранения только даты
        allowNull: false
      },
      Time: {  // Время начала
        type: DataTypes.TIME,  // Хранится в формате времени
        allowNull: false
      },
      Duration: {  
        type: DataTypes.INTEGER,  
        allowNull: false
      },
      Address:{
        type: DataTypes.STRING(255),  
        allowNull: false
      },
      Comments: { 
        type: DataTypes.STRING(255),  
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'Enrollment',
      timestamps: false
    });
  };
  