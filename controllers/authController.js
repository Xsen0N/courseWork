const { models } = require('../db/utils/db');
const bcrypt = require('bcrypt');


class AuthController {
    getLoginPage(req, res) {
        res.render("./layouts/login.hbs", { layout: "login.hbs" });
    }

    getRegisterPage = (req, res, next) => {
        res.render("./layouts/registrationAdmin.hbs", { layout: "registration.hbs" });
    }

    getRegisterAdminPage = (req, res, next) => {
        res.render("./layouts/registrationAdmin.hbs", { layout: "registrationAdmin.hbs" });
    }

    getLoginMasterPage(req, res) {
        res.render("./layouts/loginMaster.hbs", { layout: "loginMaster.hbs" });
    }

    getRegisterMasterPage = async (req, res, next) => {
        try {
            const professions = await models.professions.findAll({ raw: true });
            res.status(200).render("./layouts/registerMaster.hbs", {
                layout: "registerMaster.hbs",
                professions: professions 
            });
        } catch (error) {
            console.error('Ошибка при получении списка профессий:', error);
            res.status(500).send('Произошла ошибка при загрузке страницы регистрации');
        }
    };

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

    async registerAdmin(req, res) {
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
            Role: 1
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
        const { username, name, password, professionId, description, priceForHour } = req.body;
            
        const hashedPassword = bcrypt.hashSync(password, 10);   
        const existingUser = await models.masters.findOne({
            where: {
                Login: username
            }
        });
        
        if (existingUser) {
            req.session.previousUrl = req.headers.referer;  
            return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Этот логин уже используется' });
        }

        try {
            await models.masters.create({
                Login: username,
                Name: name,
                Password: hashedPassword,
                ProfessionId: professionId,
                Description: description || null,
                PriceForHour: priceForHour || null
            });       
            res.redirect('/auth/loginMaster');
        } catch (error) {
            console.error('Ошибка при регистрации мастера:', error);
            req.session.previousUrl = req.headers.referer;
            return res.render('./layouts/error.hbs', {
                layout: "error.hbs", 
                errorMessage: 'Ошибка при регистрации. Пожалуйста, проверьте правильность заполнения всех обязательных полей.'
            });
        }
    }
}


module.exports = new AuthController();