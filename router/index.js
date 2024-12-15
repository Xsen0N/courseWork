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


router.use("/", homeRouter);
router.use("/auth", authRouter);
router.use("/masters", mastersRouter);
router.use("/admin", adminRouter);
router.use("/enrollment", enrollmentRouter);
router.use("/services", serviceRouter);
router.use("/types", typesRouter);
router.use("/profile", profileRouter)


module.exports = router;