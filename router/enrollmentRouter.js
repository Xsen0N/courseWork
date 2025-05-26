const { Router } = require('express');
const enrollmentRouter = new Router();
const enrollmentController = require('../controllers/enrollmentController');


enrollmentRouter
    .get('/order', enrollmentController.getPersonalOrderView)
    .get('/', enrollmentController.addEnrollmentView)
    .post('/addEnrollment', enrollmentController.addEnrollment)
    .put('/cancel/:id', enrollmentController.cancelEnrollment)

   

module.exports = enrollmentRouter;