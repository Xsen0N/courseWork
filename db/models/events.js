module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Events', {
      EventId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
      },
      MasterId: {
          type: DataTypes.INTEGER,
          allowNull: false
      },
      StartDate: {
          type: DataTypes.DATE, // Используем DATE для хранения даты и времени
          allowNull: false
      },
      EndDate: {
          type: DataTypes.DATE, // Используем DATE для хранения даты и времени
          allowNull: false
      },
      Status: {
          type: DataTypes.INTEGER, // 0 - отрицательный, 1 - положительный
          allowNull: false
      }
  }, {
      sequelize,
      tableName: 'Events',
      timestamps: false // Отключаем автоматические поля createdAt и updatedAt
  });
};