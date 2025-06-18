const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const { models, syncDatabase } = require('./models');

const app = express();

// Настройка шаблонизатора
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // установите true, если используете HTTPS
}));

// Инициализация базы данных
async function initializeDatabase() {
    try {
        await syncDatabase();
        console.log('База данных инициализирована успешно');
    } catch (error) {
        console.error('Ошибка при инициализации базы данных:', error);
        process.exit(1);
    }
}

// Маршруты
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/masters', require('./routes/masters'));
app.use('/clients', require('./routes/clients'));
app.use('/requests', require('./routes/requests'));

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Что-то пошло не так!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
    });
}); 