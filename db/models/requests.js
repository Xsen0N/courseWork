module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Requests', {
      RequestId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      UserId: {
        type: DataTypes.INTEGER, 
        allowNull: false
      },
      TypeId: {
        type: DataTypes.INTEGER, 
        allowNull: false
      },
      Status: {
        type: DataTypes.ENUM(
          'pending',     // Заявка создана, ожидает откликов
          'in_progress', // Часть специалистов одобрена
          'completed',   // Все специалисты одобрены
          'cancelled'    // Заявка отменена
        ),
        defaultValue: 'pending'
      },
      Date: {  
        type: DataTypes.DATE,  
        allowNull: false
      },
      Location:{
        type: DataTypes.STRING(1000),  
        allowNull: false
      },
      Address:{
        type: DataTypes.STRING(1000),  
        allowNull: true
      },
      ServiceCount: { 
        type: DataTypes.INTEGER,  
        allowNull: false
      },
      Comments:{
        type: DataTypes.STRING(1500),  
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'Requests',
      timestamps: false
    });
  };
  