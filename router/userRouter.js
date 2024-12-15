const Router = require("express");
const router = new Router();
const userController = require("../controllers/userController");

router.get("/", userController.getRegisterPage);
router.post("/", userController.register);

module.exports = router;