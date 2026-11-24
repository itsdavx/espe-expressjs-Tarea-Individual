const valoracionService = require("../services/valoracionService");
const handleError = require("../utils/handleError");

const crearValoracion = async (req, res, next) => {
  try {
    // El userId sale del JWT, nunca del body
    const valoracion = await valoracionService.crearValoracion(req.body, req.user.id);
    res.status(201).json(valoracion);
  } catch (error) {
    handleError(res, error, next);
  }
};

const listarValoraciones = async (req, res, next) => {
  try {
    const valoraciones = await valoracionService.listarValoraciones({ clase: req.query.clase });
    res.json({ total: valoraciones.length, valoraciones });
  } catch (error) {
    handleError(res, error, next);
  }
};

const resumenValoraciones = async (req, res, next) => {
  try {
    const resumen = await valoracionService.resumenValoraciones({ clase: req.query.clase });
    res.json(resumen);
  } catch (error) {
    handleError(res, error, next);
  }
};

module.exports = { crearValoracion, listarValoraciones, resumenValoraciones };
