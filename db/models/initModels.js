const _users = require("./users");
const _gallery = require("./gallery");
const _masters = require("./masters");
const _types = require("./types");
const _enrollment = require("./enrollment");
const _scheduler = require("./scheduler");
const _services = require("./services");
const { DataTypes, Op } = require('sequelize');

function initModels(sequelize) {
  const users = _users(sequelize, DataTypes);
  const gallery = _gallery(sequelize, DataTypes);
  const masters = _masters(sequelize, DataTypes);
  const types = _types(sequelize, DataTypes);
  const enrollment = _enrollment(sequelize, DataTypes);
  const scheduler = _scheduler(sequelize, DataTypes);
  const services = _services(sequelize, DataTypes);

  services.belongsTo(types, { foreignKey: 'TypeId', onDelete: 'CASCADE' });
  types.hasMany(services, { foreignKey: 'TypeId', onDelete: 'CASCADE' });

  services.belongsTo(masters, { foreignKey: 'MasterId', onDelete: 'CASCADE' });
  masters.hasMany(services, { foreignKey: 'MasterId', onDelete: 'CASCADE' });

  gallery.belongsTo(masters, { foreignKey: 'MasterId', onDelete: 'CASCADE' });
  masters.hasMany(gallery, { foreignKey: 'MasterId', onDelete: 'CASCADE' });

  scheduler.belongsTo(enrollment, { foreignKey: 'EnrollmentId', onDelete: 'CASCADE' });
  enrollment.hasMany(scheduler, { foreignKey: 'EnrollmentId', onDelete: 'CASCADE' });

  enrollment.belongsTo(users, { foreignKey: 'UserId', onDelete: 'CASCADE' });
  users.hasMany(enrollment, { foreignKey: 'UserId', onDelete: 'CASCADE' });

  // Enrollment -> Services
  enrollment.belongsTo(services, { foreignKey: "ServiceId", onDelete: "CASCADE" });
  services.hasMany(enrollment, { foreignKey: "ServiceId", onDelete: "CASCADE" });



  return {
    users,
    masters,
    types,
    enrollment,
    scheduler,
    services,
    gallery
  };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
