const Router = require("express");
const router = new Router();
const ChatController = require("../controllers/chatController");

router.get("/", ChatController.getMainPage);

module.exports = router;