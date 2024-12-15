const Router = require("express");
const adminrouter = new Router();
const adminController = require('../controllers/adminController');

adminrouter
    .get('/', adminController.getAdminPage)
    .get('/masters', adminController.getMasters)
    .get('/types', adminController.getAllTypes)
    .get('/users', adminController.getAllUsers)
    .get('/scheduler', adminController.getScheduler)
    .get('/enrollment', adminController.getEnrollment)

    .get('/updateMaster/:id', adminController.editMasterView)
    .post('/editMaster/:id', adminController.editMaster)

    // Маршруты для операций с типами
    .get('/addType', adminController.addTypeView)
    .post('/addType', adminController.addType)
    .get('/editType/:id', adminController.editTypeView)
    .post('/editType/:id', adminController.editType)
    .delete('/deleteType/:id', adminController.deleteType)
    .delete('/deleteUser/:id', adminController.deleteUser)
    .delete('/deleteMaster/:id', adminController.deleteMaster)
    .delete('/deleteClass/:id', adminController.deleteClass)

    // Маршруты для операций с расписанием
    .put('/updateSchedule/:scheduleId/:statusId', adminController.editScheduler)
    // Маршруты для операций с записью на курсы
    .delete('/deleteEnrollment', adminController.deleteEnrollment);

module.exports = adminrouter;
