const { Router } = require('express');
const authRouter = new Router();
const authController = require('../controllers/authController');


authRouter
    .get('/login', authController.getLoginPage)
    .get('/register', authController.getRegisterPage)
    .get('/registerAdmin', authController.getRegisterAdminPage)
    .get('/loginMaster', authController.getLoginMasterPage)
    .get('/registerMaster', authController.getRegisterMasterPage)
    .post('/login', authController.login)
    .post('/register', authController.register)
    .post('/registerAdmin', authController.registerAdmin)
    .post('/loginMaster', authController.loginMaster)
    .post('/registerMaster', authController.registerMaster)
    .get('/logout', authController.logout)
    .get('/status', authController.getStatus);

    
module.exports = authRouter;