const { Router } = require('express');
const enrollmentRouter = new Router();
const enrollmentController = require('../controllers/enrollmentController');


enrollmentRouter
    .get('/order', enrollmentController.getPersonalOrderView)
    .get('/', enrollmentController.addEnrollmentView)
    .post('/addEnrollment', enrollmentController.addEnrollment)
    //.get('/updateenrollment', enrollmentController.editEnrollmentView)
    .put('/cancel/:id', enrollmentController.cancelEnrollment)
    //.put('/updateenrollment', enrollmentController.editEnrollment)
    .delete('/deleteenrollment', enrollmentController.deleteEnrollment);
   

module.exports = enrollmentRouter;