module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Gallery', {
      GalleryId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Photo: {
        type: DataTypes.BLOB('long'),
        allowNull: true
      },
      MasterId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'Gallery',
      timestamps: false
    });
  };