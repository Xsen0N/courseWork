const Router = require("express");
const router = new Router();
const homeController = require("../controllers/homeController");

router.get("/", homeController.getMainPage);

module.exports = router;