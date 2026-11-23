// Error con código HTTP: los servicios lo lanzan y los controladores lo traducen a la respuesta.
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

module.exports = HttpError;
