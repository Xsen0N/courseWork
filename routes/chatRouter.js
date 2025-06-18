const Router = require("express");
const router = new Router();
const ChatController = require("../controllers/chatController");

router.get("/data", ChatController.getChatData);
router.post("/findMasters", ChatController.findMasters);

module.exports = router; 