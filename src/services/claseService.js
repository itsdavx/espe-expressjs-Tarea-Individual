// Lógica del catálogo de clases (MongoDB). No conoce req ni res: recibe datos y devuelve documentos.
const { isValidObjectId } = require("mongoose");
const Clase = require("../models/clase");
const HttpError = require("../utils/httpError");

const CAMPOS_ORDEN = ["nombre", "codigo", "nivel", "instructor", "cupo", "duracionMinutos", "createdAt"];
const CAMPOS_PROTEGIDOS = ["_id", "slug", "createdAt", "updatedAt", "__v"];

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validarId = (id) => {
  if (!isValidObjectId(id)) throw new HttpError(400, `El id «${id}» no es un ObjectId válido`);
};

// POST /api/clases
const crearClase = async (datos) => Clase.create(datos);

// GET /api/clases?q=&fields=&sort=
const listarClases = async ({ q, fields, sort } = {}) => {
  // ?q= → búsqueda con regex, sin distinguir mayúsculas, en nombre e instructor
  const filtro = {};
  if (q && q.trim()) {
    const regex = { $regex: escaparRegex(q.trim()), $options: "i" };
    filtro.$or = [{ nombre: regex }, { instructor: regex }];
  }

  // ?fields=nombre,nivel,cupo → proyección "nombre nivel cupo"
  const proyeccion = fields
    ? fields.split(",").map((c) => c.trim()).filter(Boolean).join(" ")
    : undefined;

  // ?sort=-cupo,nombre → orden; "-" delante es descendente. Por defecto, por nombre.
  const orden = {};
  for (const parte of (sort || "nombre").split(",").map((s) => s.trim()).filter(Boolean)) {
    const campo = parte.replace(/^-/, "");
    if (!CAMPOS_ORDEN.includes(campo)) {
      throw new HttpError(400, `No se puede ordenar por «${campo}». Campos permitidos: ${CAMPOS_ORDEN.join(", ")}`);
    }
    orden[campo] = parte.startsWith("-") ? -1 : 1;
  }

  return Clase.find(filtro, proyeccion).sort(orden);
};

// GET /api/clases/:id
const obtenerClase = async (id) => {
  validarId(id);
  const clase = await Clase.findById(id);
  if (!clase) throw new HttpError(404, "La clase no existe");
  return clase;
};

// PUT /api/clases/:id → findById + save() para que corran las validaciones y el pre("validate")
const actualizarClase = async (id, datos) => {
  const clase = await obtenerClase(id);
  const cambios = { ...datos };
  CAMPOS_PROTEGIDOS.forEach((campo) => delete cambios[campo]);
  clase.set(cambios);
  return clase.save();
};

// DELETE /api/clases/:id
const eliminarClase = async (id) => {
  const clase = await obtenerClase(id);
  await clase.deleteOne();
  return clase;
};

module.exports = { crearClase, listarClases, obtenerClase, actualizarClase, eliminarClase };
