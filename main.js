const express = require('express');
const app = express();
const expressSession = require('express-session');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const hbs = require('express-handlebars').create({
    extname: '.hbs',
    helpers: {
        goBack: () => 'window.location.href = \'/\'',
        eq: (a, b) => a === b,
        formatDate: function(date) {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(date).toLocaleDateString('ru-RU', options);
        }
    }
});
const path = require('path');
const dotenv = require("dotenv").config();

const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const router = require('./router/index');

// Load SSL certificates
const credentials = {
    key: fs.readFileSync(path.join(__dirname, 'sslcert/LAB.key'), 'utf8'),
    cert: fs.readFileSync(path.join(__dirname, 'sslcert/LAB.crt'), 'utf8')
};

// Create HTTP and HTTPS servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const io = socketIo(httpsServer);

if (process.env.NODE_ENV === "development") {
    const liveReload = require('livereload');
    const connectLiveReload = require('connect-livereload');
    const liveReloadServer = liveReload.createServer();
    liveReloadServer.watch(path.join(__dirname, 'views'));
    liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
            liveReloadServer.refresh("/");
        }, 100);
    });
    app.use(connectLiveReload());
}

app.use(expressSession({
    secret: 'SECRET',
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use('/', router);

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// Start the HTTP and HTTPS servers
httpServer.listen(8080, () => {
    console.log(`HTTP Server running on port 8080`);
});
httpsServer.listen(8443, () => {
    console.log(`HTTPS Server running on port https://localhost:8443/`);
});
