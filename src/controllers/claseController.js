// Capa HTTP del catálogo: lee la petición, llama al servicio y responde con el código correcto.
const claseService = require("../services/claseService");
const handleError = require("../utils/handleError");

const crearClase = async (req, res, next) => {
  try {
    const clase = await claseService.crearClase(req.body);
    res.status(201).json(clase);
  } catch (error) {
    handleError(res, error, next);
  }
};

const listarClases = async (req, res, next) => {
  try {
    const { q, fields, sort } = req.query;
    const clases = await claseService.listarClases({ q, fields, sort });
    res.json({ total: clases.length, clases });
  } catch (error) {
    handleError(res, error, next);
  }
};

const obtenerClase = async (req, res, next) => {
  try {
    const clase = await claseService.obtenerClase(req.params.id);
    res.json(clase);
  } catch (error) {
    handleError(res, error, next);
  }
};

const actualizarClase = async (req, res, next) => {
  try {
    const clase = await claseService.actualizarClase(req.params.id, req.body);
    res.json(clase);
  } catch (error) {
    handleError(res, error, next);
  }
};

const eliminarClase = async (req, res, next) => {
  try {
    const clase = await claseService.eliminarClase(req.params.id);
    res.json({ mensaje: "Clase eliminada", clase });
  } catch (error) {
    handleError(res, error, next);
  }
};

module.exports = { crearClase, listarClases, obtenerClase, actualizarClase, eliminarClase };
