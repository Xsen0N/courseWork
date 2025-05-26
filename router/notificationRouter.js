const { Router } = require('express');
const notificationRouter = new Router();
const { notificationController } = require('../controllers/notificationController');


notificationRouter
    .get('/', notificationController.getUserNotifications)
    .put('/:id/read', notificationController.markAsRead)
    .put('/mark-all-read', notificationController.markAllAsRead);

 
module.exports = notificationRouter;