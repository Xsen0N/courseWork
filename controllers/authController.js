const { models } = require('../db/utils/db');
const bcrypt = require('bcrypt');


class AuthController {
    getLoginPage(req, res) {
        res.render("./layouts/login.hbs", { layout: "login.hbs" });
    }

    getRegisterPage = (req, res, next) => {
        res.render("./layouts/registration.hbs", { layout: "registration.hbs" });
    }

    getLoginMasterPage(req, res) {
        res.render("./layouts/loginMaster.hbs", { layout: "loginMaster.hbs" });
    }

    getRegisterMasterPage = (req, res, next) => {
        res.render("./layouts/registerMaster.hbs", { layout: "registerMaster.hbs" });
    }

    logout(req, res) {
        req.session.destroy();
        res.redirect('/');
    }
    getStatus(req, res) {
        const isAuthenticated = req.session.userId !== undefined;
        res.json({ isAuthenticated: isAuthenticated });
    }

    async login(req, res) {
        const { username, password } = req.body;
        
        try {
            const user = await models.users.findOne({ where: { Login: username } });

            if (!user) {
                return res.redirect('/auth/register');
            }
            if (bcrypt.compareSync(password, user.Password)) {
                req.session.userId = user.ID;
                const returnUrl = req.session.returnUrl || '/'; 
                delete req.session.returnUrl;
                if (user.Role === 1) { // Если роль пользователя 1 (админ)
                    res.redirect('/admin');
                } else {
                    res.redirect(returnUrl);
                }
            } else {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Неверное имя пользователя или пароль' });
            }
        } catch (error) {
            console.error('Ошибка при аутентификации пользователя:', error);
            res.status(500).send('Произошла ошибка при попытке входа');
        }
    }

    async register(req, res) {
        const { username, email, password } = req.body;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.session.previousUrl = req.headers.referer;
            return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Некорректный адрес электронной почты' });
        }
        
        const hashedPassword = bcrypt.hashSync(password, 10);   
        const existingUser = await models.users.findOne({
            where: {
                Email: email
            }
        });

        if (existingUser) {
            req.session.previousUrl = req.headers.referer;
            return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Этот адрес электронной почты уже используется' });
        }

        const existingUserLogin = await models.users.findOne({
            where: {
                Login: username
            }
        });
        
        if (existingUserLogin) {
            req.session.previousUrl = req.headers.referer;
            return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Этот логин уже занят' });
        }

        await models.users.create({
            Login: username,
            Email: email,
            Password: hashedPassword,
            Role: 0
        });       
        res.redirect('/auth/login');
    }

    async loginMaster(req, res) {
        const { username, password } = req.body;
        
        try {
            const user = await models.masters.findOne({ where: { Login: username } });

            if (!user) {
                return res.redirect('/auth/registerMaster');
            }
            if (bcrypt.compareSync(password, user.Password)) {                
                req.session.masterId = user.MasterId;
                console.log('Мастер  session id: '+req.session.masterId )
                console.log('Поль  session id: '+req.session.userId )
                res.redirect('/profile');
            } else {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Неверный пароль' });
            }
        } catch (error) {
            console.error('Ошибка при аутентификации пользователя:', error);
            res.status(500).send('Произошла ошибка при попытке входа');
        }
    }

    async registerMaster(req, res) {
        const { username, realName, password } = req.body;
            
        const hashedPassword = bcrypt.hashSync(password, 10);   
        const existingUser = await models.masters.findOne({
            where: {
                Name: username
            }
        });
        if (existingUser) {
            req.session.previousUrl = req.headers.referer;  
            return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Это имя уже используется уже используется' });
        }

        await models.masters.create({
            Login: username,
            Name: realName,
            Password: hashedPassword
        });       
        res.redirect('/auth/loginMaster');
    }
}


module.exports = new AuthController();