const _users = require("./users");
const _professions = require("./professions");
const _masters = require("./masters");
const _responses = require("./responses");
const _requests = require("./requests");

function initModels(sequelize) {
    // 1. Сначала создаем все модели БЕЗ ассоциаций
    const users = _users(sequelize);
    const professions = _professions(sequelize);
    const masters = _masters(sequelize);
    const requests = _requests(sequelize);
    const responses = _responses(sequelize);

    // 2. Затем добавляем ассоциации в правильном порядке
    // Сначала базовые независимые модели
    professions.hasMany(masters, {
        foreignKey: 'ProfessionId',
        onDelete: 'CASCADE',
        as: 'masters'
    });

    users.hasMany(requests, {
        foreignKey: 'UserId',
        onDelete: 'CASCADE',
        as: 'requests'
    });

    // Затем зависимые модели
    masters.belongsTo(professions, {
        foreignKey: 'ProfessionId',
        onDelete: 'CASCADE',
        as: 'Profession'
    });

    requests.belongsTo(users, {
        foreignKey: 'UserId',
        onDelete: 'CASCADE',
        as: 'User'
    });

    // Модели с множественными зависимостями
    responses.belongsTo(users, {
        foreignKey: 'UserId',
        onDelete: 'CASCADE',
        as: 'User'
    });

    responses.belongsTo(professions, {
        foreignKey: 'ProfessionId',
        onDelete: 'CASCADE',
        as: 'Profession'
    });

    responses.belongsTo(masters, {
        foreignKey: 'MasterId',
        onDelete: 'CASCADE',
        as: 'Master'
    });

    responses.belongsTo(requests, {
        foreignKey: 'RequestId',
        onDelete: 'CASCADE',
        as: 'Request'
    });

    return {
        users,
        professions,
        masters,
        requests,
        responses
    };
}

module.exports = initModels; 