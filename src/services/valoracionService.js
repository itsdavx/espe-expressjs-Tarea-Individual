// Valoraciones (MongoDB) que dependen de las inscripciones (PostgreSQL).
const mongoose = require("mongoose");
const prisma = require("../db/prisma");
const Valoracion = require("../models/valoracion");
const HttpError = require("../utils/httpError");
const { parseIdPg, validarObjectId } = require("../utils/ids");

// POST /api/valoraciones · crear en MongoDB validando PostgreSQL
const crearValoracion = async ({ inscripcionId, puntuacion, comentario, etiquetas }, userId) => {
  // 1) La referencia a PostgreSQL: existe (404) y es del socio del token (403)
  const id = parseIdPg(inscripcionId, "inscripcionId");
  const inscripcion = await prisma.inscripcion.findUnique({
    where: { id },
    include: { user: { select: { name: true } } }, // trae el nombre en la misma consulta
  });
  if (!inscripcion) throw new HttpError(404, "La inscripción no existe");
  if (inscripcion.userId !== userId) throw new HttpError(403, "Solo el socio dueño de la inscripción puede valorarla");
  if (inscripcion.estado === "CANCELADA") throw new HttpError(400, "No se puede valorar una inscripción cancelada");
  if (!inscripcion.claseId) throw new HttpError(400, "La inscripción no tiene una clase asociada");

  // 2) Se crea con datos que vienen de PostgreSQL, no del body:
  //    userId (del JWT), nombreSocio (copia de User.name) y clase (de Inscripcion.claseId).
  //    Si ya existe una valoración para la inscripción, el índice único lanza E11000 → 409.
  return Valoracion.create({
    inscripcionId: inscripcion.id,
    userId,
    nombreSocio: inscripcion.user.name,
    clase: inscripcion.claseId,
    puntuacion,
    comentario,
    etiquetas,
  });
};

// GET /api/valoraciones?clase= · lista con populate y orden (más nuevas primero)
const listarValoraciones = async ({ clase } = {}) => {
  const filtro = {};
  if (clase !== undefined) filtro.clase = validarObjectId(clase, "clase");
  return Valoracion.find(filtro)
    .populate("clase", "nombre nivel instructor")
    .sort({ createdAt: -1 });
};

// GET /api/valoraciones/resumen?clase= · aggregate: promedio y total por clase
const resumenValoraciones = async ({ clase } = {}) => {
  const etapas = [];
  if (clase !== undefined) {
    etapas.push({ $match: { clase: new mongoose.Types.ObjectId(validarObjectId(clase, "clase")) } });
  }
  etapas.push(
    { $group: { _id: "$clase", promedio: { $avg: "$puntuacion" }, total: { $sum: 1 } } },
    { $lookup: { from: "clases", localField: "_id", foreignField: "_id", as: "clase" } },
    { $unwind: { path: "$clase", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        claseId: "$_id",
        nombre: "$clase.nombre",
        promedio: { $round: ["$promedio", 2] },
        total: 1,
      },
    },
    { $sort: { promedio: -1, total: -1 } },
  );
  return Valoracion.aggregate(etapas);
};

module.exports = { crearValoracion, listarValoraciones, resumenValoraciones };
