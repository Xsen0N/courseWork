const express = require('express');
const app = express();
const expressSession = require('express-session');
const http = require('http');
const hbs = require('express-handlebars').create({
    extname: '.hbs',
    helpers: {
        goBack: () => 'window.location.href = \'/\'',
        eq: (a, b) => a === b,
        formatDate: function(date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        formatTime: function(date) {
            if (!date) return '';
            return new Date(date).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        },
        formatISO: function(date) {
            if (!date) return '';
            return new Date(date).toISOString();
        },
        split: function(str, options) {
            if (typeof str !== 'string') return [];
            const delimiter = options.hash.delimiter || ',';
            return str.split(delimiter).map(s => s.trim());
        },
        or: (a, b, options) => a || b
    }
});
const path = require('path');
const dotenv = require("dotenv").config();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const bodyParser = require('body-parser');
const router = require('./router/index');

const port = process.env.PORT || 8080;

// Настройка сессий
app.use(expressSession({
    secret: 'SECRET',
    resave: false,
    saveUninitialized: false
}));

// Парсинг данных из форм и JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Настройка Handlebars
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Роутинг
app.use('/api', router);  // API routes
app.use('/', router);     // Web routes

// Загрузка Swagger-документации
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Подключение Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Запуск HTTP-сервера
http.createServer(app).listen(port, () => {
    console.log(`HTTP Server running on port ${port}`);
});