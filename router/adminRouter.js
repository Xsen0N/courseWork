const Router = require("express");
const adminrouter = new Router();
const adminController = require('../controllers/adminController');

adminrouter
    .get('/', adminController.getAdminPage)
    .get('/masters', adminController.getMasters)
    .get('/types', adminController.getAllTypes)
    .get('/users', adminController.getAllUsers)
    .get('/scheduler', adminController.getScheduler)
    .get('/services', adminController.getServices)
    .get('/enrollment', adminController.getEnrollment)
    .get('/criterias', adminController.getCriterias)
    .get('/professions', adminController.getProfessions)
    .get('/updateMaster/:id', adminController.editMasterView)
    .post('/editMaster/:id', adminController.editMaster)

    .get('/addType', adminController.addTypeView)
    .post('/addType', adminController.addType)
    .get('/editType/:id', adminController.editTypeView)
    .post('/editType/:id', adminController.editType)
    .delete('/deleteType/:id', adminController.deleteType)
    .delete('/deleteUser/:id', adminController.deleteUser)
    .delete('/deleteService/:id', adminController.deleteService)
    .delete('/deleteMaster/:id', adminController.deleteMaster)
    .delete('/deleteCriterion/:id', adminController.deleteCriterion)
    .post('/editCriterias/:id', adminController.editCriterias)
    .post('/addCriterias', adminController.addCriterias)
    .delete('/deleteProfession/:id', adminController.deleteProfession)
    .post('/editProfession/:id', adminController.editProfession)
    .post('/addProfession', adminController.addProfession)
    .put('/services/:id/status', adminController.changeStatusOfService)


module.exports = adminrouter;
