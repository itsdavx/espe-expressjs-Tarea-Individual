// Leer valoraciones es público; valorar exige el JWT del socio dueño de la inscripción.
const { Router } = require("express");
const valoracionController = require("../controllers/valoracionController");
const authenticateToken = require("../middlewares/auth");

const router = Router();

router.post("/", authenticateToken, valoracionController.crearValoracion);
router.get("/", valoracionController.listarValoraciones);
router.get("/resumen", valoracionController.resumenValoraciones);

module.exports = router;
