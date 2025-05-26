module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Notification', {
    NotificationId:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Message: DataTypes.TEXT,
    Type: {
      type: DataTypes.ENUM(
        'new_request',
        'application_status',
        'system_alert',
        'response_approved',
        'request_completed'
      ),
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    Metadata: DataTypes.TEXT,
    UsersId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'UserId'  // Явно указываем имя колонки в БД
    },
    MasterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'MasterId'
    }
  });
};