const Router = require("express");
const requestRouter = new Router();
const requestController = require("../controllers/requestsController");

requestRouter
    .get("/", requestController.getRequestPage)
    .post("/create", requestController.addRequest)
    .get("/available", requestController.getAvailableRequests)
    .post("/respond", requestController.respondToRequest)
    .post("/response/approve", requestController.approveSpecialist)
    .post("/response/reject", requestController.rejectSpecialist)
    .post("/process-response", requestController.processResponse);

module.exports = requestRouter;