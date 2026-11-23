const { Router } = require("express");
const authRouter = require("./auth");
const clasesRouter = require("./clases");

const router = Router();

router.use("/auth", authRouter);
router.use("/clases", clasesRouter);

module.exports = router;
