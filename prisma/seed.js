// Datos iniciales de PostgreSQL: un administrador y un socio con contraseña cifrada.
// Se puede correr varias veces (upsert por email).
const bcrypt = require("bcryptjs");
const prisma = require("../src/db/prisma");

const usuarios = [
  { name: "Administrador Gimnasio", email: "admin@gimnasio.com", password: "Admin123*", role: "ADMIN" },
  { name: "Socio de Prueba", email: "socio@gimnasio.com", password: "Socio123*", role: "USER" },
];

async function main() {
  for (const { password, ...datos } of usuarios) {
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email: datos.email },
      update: { name: datos.name, role: datos.role, password: hash },
      create: { ...datos, password: hash },
    });
    console.log(`Usuario listo: ${datos.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
