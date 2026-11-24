const inscripcionService = require("../services/inscripcionService");
const handleError = require("../utils/handleError");

// El userId siempre sale del JWT (req.user.id), nunca del body.

const crearInscripcion = async (req, res, next) => {
  try {
    const inscripcion = await inscripcionService.crearInscripcion(req.body, req.user.id);
    res.status(201).json(inscripcion);
  } catch (error) {
    handleError(res, error, next);
  }
};

const listarMias = async (req, res, next) => {
  try {
    const inscripciones = await inscripcionService.listarMias(req.user.id);
    res.json({ total: inscripciones.length, inscripciones });
  } catch (error) {
    handleError(res, error, next);
  }
};

const cancelarInscripcion = async (req, res, next) => {
  try {
    const inscripcion = await inscripcionService.cancelarInscripcion(req.params.id, req.user.id);
    res.json(inscripcion);
  } catch (error) {
    handleError(res, error, next);
  }
};

const eliminarInscripcion = async (req, res, next) => {
  try {
    const resultado = await inscripcionService.eliminarInscripcion(req.params.id, req.user.id);
    res.json({ mensaje: "Inscripción eliminada", ...resultado });
  } catch (error) {
    handleError(res, error, next);
  }
};

module.exports = { crearInscripcion, listarMias, cancelarInscripcion, eliminarInscripcion };
