const { Sequelize } = require('sequelize');

const connection = new Sequelize('CourseW', 'sa', 'P@ssw0rd!', {
    host: 'db',
    dialect: 'mssql',
    port: 1433,
    dialectOptions: {
        options: {
            encrypt: false,
        },
    },
});

async function dropAllTables() {
    try {
        // Отключаем проверку внешних ключей
        await connection.query('ALTER DATABASE CourseW SET SINGLE_USER WITH ROLLBACK IMMEDIATE');
        await connection.query('EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"');

        // Удаляем все таблицы в правильном порядке
        const tables = [
            'Responses',
            'RequestCriterias',
            'ServiceCriterias',
            'RequestProfessions',
            'Gallery',
            'Services',
            'Events',
            'Scheduler',
            'Enrollment',
            'Notifications',
            'Master',
            'Requests',
            'Users',
            'Criterias',
            'Types',
            'Profession'
        ];

        for (const table of tables) {
            try {
                await connection.query(`IF OBJECT_ID('${table}', 'U') IS NOT NULL DROP TABLE [${table}]`);
                console.log(`Table ${table} dropped successfully`);
            } catch (error) {
                console.error(`Error dropping table ${table}:`, error);
            }
        }

        // Включаем проверку внешних ключей обратно
        await connection.query('ALTER DATABASE CourseW SET MULTI_USER');
        await connection.query('EXEC sp_msforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"');

        console.log('All tables dropped successfully');
    } catch (error) {
        console.error('Error dropping tables:', error);
    } finally {
        await connection.close();
    }
}

dropAllTables(); 