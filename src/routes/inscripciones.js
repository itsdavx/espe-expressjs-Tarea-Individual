// Todas las rutas de inscripciones exigen el JWT: la inscripción siempre es del socio del token.
const { Router } = require("express");
const inscripcionController = require("../controllers/inscripcionController");
const authenticateToken = require("../middlewares/auth");

const router = Router();

router.use(authenticateToken);

router.post("/", inscripcionController.crearInscripcion);
router.get("/mias", inscripcionController.listarMias);
router.patch("/:id/cancelar", inscripcionController.cancelarInscripcion);
router.delete("/:id", inscripcionController.eliminarInscripcion);

module.exports = router;
