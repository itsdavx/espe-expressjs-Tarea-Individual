// Traduce los errores de los servicios, Mongoose y MongoDB a respuestas HTTP con mensaje en español.
const handleError = (res, error, next) => {
  if (error.name === "HttpError") {
    return res.status(error.statusCode).json({ error: error.message });
  }
  if (error.name === "ValidationError") {
    const errores = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({ error: "Datos inválidos", errores });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ error: `Valor inválido para «${error.path}»: ${JSON.stringify(error.value)}` });
  }
  if (error.code === 11000) {
    // E11000: se violó un índice único de MongoDB
    const campos = Object.keys(error.keyValue || error.keyPattern || {}).join(", ");
    return res.status(409).json({ error: `Ya existe un registro con el mismo valor en: ${campos}` });
  }
  return next(error); // 500 en el errorHandler global
};

module.exports = handleError;
