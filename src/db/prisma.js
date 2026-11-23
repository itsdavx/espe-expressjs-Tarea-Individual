// Única conexión a PostgreSQL (Prisma 7 + adaptador pg) para toda la aplicación.
// Los servicios importan esta instancia en lugar de crear su propio PrismaClient.
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
