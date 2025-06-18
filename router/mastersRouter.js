const Router = require('express');
const router = new Router();
const mastersController = require('../controllers/mastersController');

router
    .get('/', mastersController.getMastersList)
    .get('/:id', mastersController.getMasterDetails);

module.exports = router;