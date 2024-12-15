const { Router } = require('express');
const authRouter = new Router();
const authController = require('../controllers/authController');


authRouter
    .get('/login', authController.getLoginPage)
    .get('/register', authController.getRegisterPage)
    .get('/loginMaster', authController.getLoginMasterPage)
    .get('/registerMaster', authController.getRegisterMasterPage)
    .post('/login', authController.login)
    .post('/register', authController.register)
    .post('/loginMaster', authController.loginMaster)
    .post('/registerMaster', authController.registerMaster)
    .get('/logout', authController.logout)
    .get('/status', authController.getStatus);

    
module.exports = authRouter;