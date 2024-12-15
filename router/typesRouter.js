const { Router } = require('express');
const typesRouter = new Router();
const typesController = require('../controllers/typesController');


typesRouter
    .get('/', typesController.getAllTypes)
    .get('/:masterId', typesController.getMasterType)
    
module.exports = typesRouter;