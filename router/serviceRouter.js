const { Router } = require('express');
const serviceRouter = new Router();
const serviceController = require('../controllers/serviceController');


serviceRouter
    .get('/', serviceController.getAllServices)
    .get('/:id', serviceController.getOneService)

module.exports = serviceRouter;