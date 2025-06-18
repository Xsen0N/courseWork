const Router = require("express");
const router = new Router();
const ChatController = require("../controllers/chatController");

const chatController = new ChatController();

router.get("/data", (req, res) => chatController.getData(req, res));
router.post("/findMasters", (req, res) => chatController.findMasters(req, res));

module.exports = router;