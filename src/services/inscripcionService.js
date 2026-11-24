// Inscripciones (PostgreSQL) que dependen del catálogo de clases (MongoDB).
const { Prisma } = require("@prisma/client");
const prisma = require("../db/prisma");
const Clase = require("../models/clase");
const Valoracion = require("../models/valoracion");
const HttpError = require("../utils/httpError");
const { parseIdPg, validarObjectId } = require("../utils/ids");

const DIA_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const dosDigitos = (n) => String(n).padStart(2, "0");

// La fecha de la sesión debe caer en uno de los horarios embebidos de la clase (día + hora de inicio).
const validarHorario = (clase, fecha) => {
  const dia = DIA_SEMANA[fecha.getDay()];
  const hora = `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
  const coincide = clase.horarios.some((h) => h.dia === dia && h.horaInicio === hora);
  if (!coincide) {
    const disponibles = clase.horarios.map((h) => `${h.dia} ${h.horaInicio}`).join(", ");
    throw new HttpError(400, `La fecha (${dia} ${hora}) no coincide con ningún horario de la clase: ${disponibles}`);
  }
};

// Busca la inscripción y comprueba que sea del socio del token.
const obtenerPropia = async (id, userId) => {
  const inscripcion = await prisma.inscripcion.findUnique({ where: { id: parseIdPg(id) } });
  if (!inscripcion) throw new HttpError(404, "La inscripción no existe");
  if (inscripcion.userId !== userId) throw new HttpError(403, "La inscripción no pertenece a este socio");
  return inscripcion;
};

// POST /api/inscripciones · crear en PostgreSQL validando MongoDB
const crearInscripcion = async ({ claseId, fechaSesion }, userId) => {
  // 1) La referencia a MongoDB: formato y existencia (no hay FK entre bases)
  validarObjectId(claseId, "claseId");
  const existe = await Clase.exists({ _id: claseId });
  if (!existe) throw new HttpError(404, "La clase no existe en el catálogo");

  // 2) Datos del catálogo que necesita la regla del cupo
  const clase = await Clase.findById(claseId, "nombre cupo horarios").lean();

  const fecha = new Date(fechaSesion);
  if (!fechaSesion || Number.isNaN(fecha.getTime())) {
    throw new HttpError(400, "La fechaSesion es obligatoria y debe ser una fecha válida (ej. 2027-01-04T06:00:00)");
  }
  if (fecha <= new Date()) throw new HttpError(400, "La fechaSesion debe ser futura");
  validarHorario(clase, fecha);

  // 3) Cupo duro: contar e insertar dentro de UNA transacción Serializable.
  //    Si dos socios piden el último lugar a la vez, PostgreSQL deja pasar solo a uno (el otro → P2034 → 409).
  const inscripcion = await prisma.$transaction(
    async (tx) => {
      const previa = await tx.inscripcion.findUnique({
        where: { userId_claseId_fechaSesion: { userId, claseId, fechaSesion: fecha } },
      });
      if (previa && previa.estado === "ACTIVA") {
        throw new HttpError(409, "Ya estás inscrito en esta sesión");
      }

      const ocupados = await tx.inscripcion.count({
        where: { claseId, fechaSesion: fecha, estado: "ACTIVA" },
      });
      if (ocupados >= clase.cupo) {
        throw new HttpError(409, `Cupo lleno: la sesión ya tiene ${ocupados} de ${clase.cupo} lugares ocupados`);
      }

      // Si la había cancelado, se reactiva (la restricción única no permite otra fila igual)
      if (previa) {
        return tx.inscripcion.update({ where: { id: previa.id }, data: { estado: "ACTIVA" } });
      }
      return tx.inscripcion.create({ data: { userId, claseId, fechaSesion: fecha } });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return { ...inscripcion, clase: { _id: clase._id, nombre: clase.nombre, cupo: clase.cupo } };
};

// GET /api/inscripciones/mias · consulta unida: PostgreSQL + catálogo con $in + Map (2 consultas, sin N+1)
const listarMias = async (userId) => {
  const inscripciones = await prisma.inscripcion.findMany({
    where: { userId },
    orderBy: { fechaSesion: "desc" },
  });

  // Una sola consulta a MongoDB con todos los ids distintos
  const ids = [...new Set(inscripciones.map((i) => i.claseId).filter(Boolean))];
  const clases = await Clase.find(
    { _id: { $in: ids } },
    "nombre nivel instructor duracionMinutos",
  ).lean();
  const porId = new Map(clases.map((c) => [String(c._id), c]));

  return inscripciones.map((i) => ({ ...i, clase: porId.get(i.claseId) ?? null }));
};

// PATCH /api/inscripciones/:id/cancelar · libera el cupo
const cancelarInscripcion = async (id, userId) => {
  const inscripcion = await obtenerPropia(id, userId);
  if (inscripcion.estado === "CANCELADA") throw new HttpError(409, "La inscripción ya estaba cancelada");
  return prisma.inscripcion.update({ where: { id: inscripcion.id }, data: { estado: "CANCELADA" } });
};

// DELETE /api/inscripciones/:id · borra en las dos bases sin dejar huérfanos
// Orden: primero lo que depende (la valoración en MongoDB), después la inscripción en PostgreSQL.
// Si falla a la mitad, puede quedar una inscripción sin valoración, pero nunca una valoración huérfana.
const eliminarInscripcion = async (id, userId) => {
  const inscripcion = await obtenerPropia(id, userId);
  const { deletedCount } = await Valoracion.deleteMany({ inscripcionId: inscripcion.id });
  await prisma.inscripcion.delete({ where: { id: inscripcion.id } });
  return { inscripcion, valoracionesEliminadas: deletedCount };
};

module.exports = { crearInscripcion, listarMias, cancelarInscripcion, eliminarInscripcion };
