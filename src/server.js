require("dotenv").config();
const app = require("./app.js");
const connectMongo = require("./db/mongo.js");
const PORT = process.env.PORT || 3000;

// El servidor solo abre el puerto si MongoDB conecta.
connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo conectar a MongoDB:", error.message);
    process.exit(1);
  });
