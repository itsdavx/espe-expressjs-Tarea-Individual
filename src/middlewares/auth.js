require("dotenv").config();
const jwt = require("jsonwebtoken");

// Verifica el JWT emitido por el login (usuarios de PostgreSQL) y deja { id, role } en req.user.
function authenticateToken(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Acceso denegado: falta el token" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido o expirado" });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
