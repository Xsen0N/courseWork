const { Router } = require('express');
const masterRouter = new Router();
const masterController = require('../controllers/masterController');


masterRouter
    .get('/', masterController.getAllMasters)
    .get('/:id', masterController.getOneMaster)
    .post('/:id',  masterController.updateMaster)
    .delete('/:id', masterController.deleteMaster)
 
module.exports = masterRouter;