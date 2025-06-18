module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Notification', {
    NotificationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    Type: {
      type: DataTypes.ENUM(
        'new_request',
        'application_status',
        'system_alert',
        'response_approved',
        'request_completed',
        'request_progress'
      ),
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    Metadata: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    MasterId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Notifications',
    timestamps: true // Включаем timestamps
  });
};