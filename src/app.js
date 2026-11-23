const express = require("express");
const routes = require("./routes/index");
const LoggerMiddleware = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(express.json());
app.use(LoggerMiddleware);

app.get("/", (req, res) => {
  res.send("API Gimnasio · PostgreSQL + MongoDB");
});

app.use("/api", routes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Errores no controlados (siempre al final)
app.use(errorHandler);

module.exports = app;
