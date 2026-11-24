// Registro que crece sin límite: va en su propia colección, nunca embebido en la Clase.
// Guarda ids de PostgreSQL como Number (sin FK) y una copia del nombre del socio.
const mongoose = require("mongoose");

const valoracionSchema = new mongoose.Schema(
  {
    // → PostgreSQL Inscripcion.id. Único: una valoración por inscripción (E11000 → 409).
    inscripcionId: {
      type: Number,
      required: [true, "El id de la inscripción es obligatorio"],
      unique: true,
    },
    // → PostgreSQL User.id. Sale del JWT, nunca del body.
    userId: {
      type: Number,
      required: [true, "El id del socio es obligatorio"],
    },
    // Copia de User.name (desnormalización) para listar sin consultar PostgreSQL.
    nombreSocio: {
      type: String,
      required: [true, "El nombre del socio es obligatorio"],
      trim: true,
    },
    // Referencia dentro de MongoDB → populate.
    clase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clase",
      required: [true, "La clase es obligatoria"],
    },
    puntuacion: {
      type: Number,
      required: [true, "La puntuación es obligatoria"],
      min: [1, "La puntuación mínima es 1"],
      max: [5, "La puntuación máxima es 5"],
      validate: {
        validator: Number.isInteger,
        message: (props) => `La puntuación debe ser un número entero (recibido: ${props.value})`,
      },
    },
    comentario: {
      type: String,
      trim: true,
      maxlength: [500, "El comentario no puede superar 500 caracteres"],
    },
    etiquetas: {
      type: [String],
      default: [],
      validate: {
        validator: (lista) => lista.length <= 5,
        message: "Se permiten como máximo 5 etiquetas",
      },
    },
  },
  { timestamps: true },
);

// La lista de valoraciones de una clase se lee siempre así: por clase y las más nuevas primero.
valoracionSchema.index({ clase: 1, createdAt: -1 });

module.exports = mongoose.model("Valoracion", valoracionSchema, "valoraciones");
