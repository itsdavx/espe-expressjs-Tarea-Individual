// Rutas del catálogo: las lecturas son públicas; las escrituras exigen el JWT del login (PostgreSQL).
const { Router } = require("express");
const claseController = require("../controllers/claseController");
const authenticateToken = require("../middlewares/auth");

const router = Router();

router.post("/", authenticateToken, claseController.crearClase);
router.get("/", claseController.listarClases);
router.get("/:id", claseController.obtenerClase);
router.put("/:id", authenticateToken, claseController.actualizarClase);
router.delete("/:id", authenticateToken, claseController.eliminarClase);

module.exports = router;
