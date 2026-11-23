// Única conexión a MongoDB (Mongoose) para toda la aplicación.
// server.js la espera antes de abrir el puerto: sin MongoDB, el servidor no arranca.
const mongoose = require("mongoose");

const connectMongo = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a MongoDB");
};

module.exports = connectMongo;
