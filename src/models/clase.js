// Catálogo del gimnasio en MongoDB: cada Clase trae embebidos sus horarios de la temporada.
const mongoose = require("mongoose");
const slugify = require("slugify");

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm en 24 horas

// Subdocumento embebido: se lee y se cambia junto con la clase, y está acotado (máx. 6).
const horarioSchema = new mongoose.Schema(
  {
    dia: {
      type: String,
      required: [true, "El día del horario es obligatorio"],
      lowercase: true,
      enum: { values: DIAS, message: "El día «{VALUE}» no es válido (lunes a domingo, sin tildes)" },
    },
    horaInicio: {
      type: String,
      required: [true, "La hora de inicio es obligatoria"],
      match: [HORA, "La hora de inicio debe tener el formato HH:mm (24 horas)"],
    },
    horaFin: {
      type: String,
      required: [true, "La hora de fin es obligatoria"],
      match: [HORA, "La hora de fin debe tener el formato HH:mm (24 horas)"],
      validate: {
        // Validación propia: el horario no puede terminar antes de empezar.
        validator: function (valor) {
          return !this.horaInicio || valor > this.horaInicio;
        },
        message: (props) => `La hora de fin (${props.value}) debe ser posterior a la hora de inicio`,
      },
    },
    temporada: {
      type: String,
      required: [true, "La temporada del horario es obligatoria"],
      uppercase: true,
      match: [/^\d{4}-T[1-4]$/, "La temporada debe tener el formato AAAA-T1 a AAAA-T4 (ej. 2026-T4)"],
    },
  },
  { _id: false },
);

const claseSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la clase es obligatorio"],
      trim: true,
      unique: true,
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxlength: [60, "El nombre no puede superar 60 caracteres"],
    },
    codigo: {
      type: String,
      required: [true, "El código es obligatorio"],
      trim: true,
      uppercase: true,
      unique: true,
      match: [/^[A-Z]{3}-\d{3}$/, "El código debe tener el formato ABC-123 (ej. SPN-101)"],
    },
    nivel: {
      type: String,
      required: [true, "El nivel es obligatorio"],
      enum: {
        values: ["principiante", "intermedio", "avanzado"],
        message: "El nivel «{VALUE}» no es válido (principiante, intermedio o avanzado)",
      },
    },
    instructor: {
      type: String,
      required: [true, "El instructor es obligatorio"],
      trim: true,
      minlength: [3, "El nombre del instructor debe tener al menos 3 caracteres"],
    },
    cupo: {
      type: Number,
      required: [true, "El cupo es obligatorio"],
      min: [5, "El cupo mínimo es de 5 personas"],
      max: [40, "El cupo máximo es de 40 personas"],
      validate: {
        validator: Number.isInteger,
        message: (props) => `El cupo debe ser un número entero (recibido: ${props.value})`,
      },
    },
    duracionMinutos: {
      type: Number,
      default: 60,
      min: [30, "La clase dura al menos 30 minutos"],
      max: [120, "La clase dura como máximo 120 minutos"],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [300, "La descripción no puede superar 300 caracteres"],
    },
    horarios: {
      type: [horarioSchema],
      validate: {
        // Validación propia del arreglo: entre 1 y 6 horarios y sin repetir día + hora.
        validator: function (lista) {
          if (lista.length < 1 || lista.length > 6) return false;
          const claves = lista.map((h) => `${h.dia}-${h.horaInicio}`);
          return new Set(claves).size === claves.length;
        },
        message: "La clase debe tener entre 1 y 6 horarios, sin repetir el mismo día y hora",
      },
    },
    equipamiento: {
      type: [String],
      default: [],
    },
    slug: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
    id: false, // sin el virtual "id" duplicado de _id
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: resumen listo para mostrar en el catálogo (no se guarda en la base).
claseSchema.virtual("resumen").get(function () {
  if (!this.nombre || !this.horarios) return undefined;
  const sesiones = this.horarios.length;
  return `${this.nombre} · ${this.nivel} · ${sesiones} ${sesiones === 1 ? "sesión" : "sesiones"} por semana · cupo ${this.cupo}`;
});

// Middleware sin next: genera el slug y ordena los horarios por día y hora antes de validar.
claseSchema.pre("validate", function () {
  if (this.nombre) {
    this.slug = slugify(this.nombre, { lower: true, strict: true });
  }
  if (Array.isArray(this.horarios) && this.horarios.length > 1) {
    const orden = (h) => `${DIAS.indexOf(h.dia)}-${h.horaInicio}`;
    this.horarios.sort((a, b) => orden(a).localeCompare(orden(b)));
  }
});

module.exports = mongoose.model("Clase", claseSchema, "clases");
