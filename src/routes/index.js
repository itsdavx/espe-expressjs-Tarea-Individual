const { Router } = require("express");
const authRouter = require("./auth");
const clasesRouter = require("./clases");
const inscripcionesRouter = require("./inscripciones");
const valoracionesRouter = require("./valoraciones");

const router = Router();

router.use("/auth", authRouter);
router.use("/clases", clasesRouter);
router.use("/inscripciones", inscripcionesRouter);
router.use("/valoraciones", valoracionesRouter);

module.exports = router;
