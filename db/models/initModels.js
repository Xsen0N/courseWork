const _users = require("./users");
const _gallery = require("./gallery");
const _masters = require("./masters");
const _criterias = require("./criterias");
const _types = require("./types");
const _enrollment = require("./enrollment");
const _scheduler = require("./scheduler");
const _services = require("./services");
const _events = require("./events");
const _professions = require("./profession");
const _requests = require("./requests");
const _requestProfession = require("./requestProfession");
const _serviceCriterias = require("./serviceCriterias"); // Добавлена промежуточная модель
const _requestCriterias = require("./requestCriterias"); // Добавлена промежуточная модель
const _responses = require("./response");
const _notifications = require("./notification");
const { DataTypes, Op } = require('sequelize');

function initModels(sequelize) {
  // Инициализация всех моделей
  const users = _users(sequelize, DataTypes);
  const gallery = _gallery(sequelize, DataTypes);
  const masters = _masters(sequelize, DataTypes);
  const types = _types(sequelize, DataTypes);
  const enrollment = _enrollment(sequelize, DataTypes);
  const scheduler = _scheduler(sequelize, DataTypes);
  const services = _services(sequelize, DataTypes);
  const criterias = _criterias(sequelize, DataTypes);
  const events = _events(sequelize, DataTypes);
  const professions = _professions(sequelize, DataTypes);
  const requests = _requests(sequelize, DataTypes);
  const requestProfession = _requestProfession(sequelize, DataTypes);
  const serviceCriterias = _serviceCriterias(sequelize, DataTypes);
  const requestCriterias = _requestCriterias(sequelize, DataTypes);
  const responses = _responses(sequelize, DataTypes);
  const notifications = _notifications(sequelize, DataTypes);

  // Ассоциации для Services
  services.belongsTo(types, { 
    foreignKey: 'TypeId', 
    onDelete: 'CASCADE' 
  });
  services.belongsTo(masters, { 
    foreignKey: 'MasterId', 
    onDelete: 'CASCADE' 
  });
  services.belongsToMany(criterias, {
    through: serviceCriterias,
    foreignKey: 'ServiceId',
    otherKey: 'CriteriasId'
  });

  // Ассоциации для Masters
  masters.hasMany(services, { 
    foreignKey: 'MasterId', 
    onDelete: 'CASCADE' 
  });
  masters.hasMany(gallery, { 
    foreignKey: 'MasterId', 
    onDelete: 'CASCADE' 
  });
  masters.hasMany(events, { 
    foreignKey: 'MasterId', 
    onDelete: 'CASCADE' 
  });
  masters.belongsTo(professions, { 
    foreignKey: 'ProfessionId', 
    onDelete: 'CASCADE' 
  });

  // Ассоциации для Requests
  requests.belongsTo(users, { 
    foreignKey: 'UserId', 
    onDelete: 'CASCADE' 
  });
  requests.belongsTo(types, { 
    foreignKey: 'TypeId', 
    onDelete: 'CASCADE' 
  });
  requests.belongsToMany(professions, {
    through: requestProfession,
    foreignKey: 'RequestId',
    otherKey: 'ProfessionId'
  });
  requests.belongsToMany(criterias, {
    through: 'RequestCriterias',
    foreignKey: 'RequestId',
    otherKey: 'CriteriasId'
  });

  // Ассоциации для Professions
  professions.hasMany(masters, { 
    foreignKey: 'ProfessionId', 
    onDelete: 'CASCADE' 
  });
  professions.belongsToMany(requests, {
    through: requestProfession,
    foreignKey: 'ProfessionId',
    otherKey: 'RequestId'
  });

  // Ассоциации для Criterias
  criterias.belongsToMany(services, {
    through: serviceCriterias,
    foreignKey: 'CriteriasId',
    otherKey: 'ServiceId'
  });
  criterias.belongsToMany(requests, {
    through: 'RequestCriterias',
    foreignKey: 'CriteriasId',
    otherKey: 'RequestId'
  });

  // Ассоциации для Enrollment
  enrollment.belongsTo(users, { 
    foreignKey: 'UserId', 
    onDelete: 'CASCADE' 
  });
  enrollment.belongsTo(services, { 
    foreignKey: 'ServiceId', 
    onDelete: 'CASCADE' 
  });
  enrollment.hasMany(scheduler, { 
    foreignKey: 'EnrollmentId', 
    onDelete: 'CASCADE' 
  });

  // Ассоциации для Notifications
notifications.belongsTo(users, {
  foreignKey: 'UserId', // Используем тот же регистр, что и в модели
  as: 'user',
  onDelete: 'CASCADE'
});

notifications.belongsTo(masters, {
  foreignKey: 'MasterId', // Используем тот же регистр, что и в модели
  as: 'master',
  onDelete: 'CASCADE'
});

// Для пользователей и мастеров
users.hasMany(notifications, {
  foreignKey: 'UserId',
  as: 'notifications'
});

masters.hasMany(notifications, {
  foreignKey: 'MasterId',
  as: 'notifications'
});

  // Ассоциации для Responses
  responses.belongsTo(requests, { 
    foreignKey: 'RequestId', 
    onDelete: 'CASCADE' 
  });
  responses.belongsTo(masters, { 
    foreignKey: 'MasterId', 
    onDelete: 'CASCADE' 
  });

  return {
    users,
    masters,
    types,
    enrollment,
    scheduler,
    services,
    gallery,
    criterias,
    events,
    professions,
    requests,
    requestProfession,
    serviceCriterias,
    requestCriterias,
    responses,
    notifications
  };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;