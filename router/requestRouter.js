const Router = require("express");
const requestRouter = new Router();
const requestController = require("../controllers/requestsController");

requestRouter
    .get("/", requestController.getRequestPage)
    .post("/create", requestController.addRequest)


module.exports = requestRouter;