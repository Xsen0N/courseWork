const Router = require("express");
const router = new Router();
const mastersRouter = require("./mastersRouter");
const enrollmentRouter = require("./enrollmentRouter");
const serviceRouter = require("./serviceRouter");
const homeRouter = require("./homeRouter");
const authRouter = require("./authRouter");
const typesRouter = require("./typesRouter");
const adminRouter = require("./adminRouter");
const profileRouter = require("./profileRouter");
const requestRouter = require("./requestRouter");
const notificationRouter = require("./notificationRouter");
const chatRouter = require("./chatRouter");


router.use("/", homeRouter);
router.use("/request", requestRouter);
router.use("/auth", authRouter);
router.use("/masters", mastersRouter);
router.use("/chat", chatRouter);
router.use("/admin", adminRouter);
router.use("/enrollment", enrollmentRouter);
router.use("/services", serviceRouter);
router.use("/types", typesRouter);
router.use("/profile", profileRouter);
router.use("/notifications", notificationRouter);


module.exports = router;