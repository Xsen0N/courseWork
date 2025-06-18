const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/', homeController.getMainPage);
router.post('/api/filterMasters', homeController.filterMasters);

module.exports = router; 