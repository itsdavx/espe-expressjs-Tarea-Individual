// Validación de ids que llegan por la URL o el body.
const { isValidObjectId } = require("mongoose");
const HttpError = require("./httpError");

// Id entero de PostgreSQL (autoincrement)
const parseIdPg = (valor, nombre = "id") => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `El ${nombre} «${valor}» debe ser un número entero positivo`);
  }
  return id;
};

// _id de MongoDB (ObjectId de 24 hex)
const validarObjectId = (valor, nombre = "id") => {
  if (!valor || !isValidObjectId(valor)) {
    throw new HttpError(400, `El ${nombre} «${valor ?? ""}» no es un ObjectId válido`);
  }
  return valor;
};

module.exports = { parseIdPg, validarObjectId };
