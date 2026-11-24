// Carga datos de ejemplo USANDO LA API (así pasan por todas las validaciones de las dos bases).
// Requisitos: npm run dev corriendo y el seed de PostgreSQL ejecutado (npx prisma db seed).
// Uso: npm run demo   · Se puede correr varias veces: lo que ya existe se reutiliza.
const BASE = process.env.API_URL || "http://localhost:3000/api";

const llamar = async (metodo, ruta, { token, body } = {}) => {
  const res = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const datos = await res.json().catch(() => ({}));
  return { status: res.status, datos };
};

const login = async (email, password) => {
  const { status, datos } = await llamar("POST", "/auth/login", { body: { email, password } });
  if (status !== 200) throw new Error(`No se pudo iniciar sesión con ${email}: ${datos.error}`);
  return datos.token;
};

const CLASES = [
  {
    nombre: "Spinning Intenso", codigo: "SPN-101", nivel: "intermedio", instructor: "Carla Mena",
    cupo: 20, duracionMinutos: 45, equipamiento: ["bicicleta", "toalla"],
    descripcion: "Ciclismo indoor por intervalos de alta intensidad.",
    horarios: [
      { dia: "lunes", horaInicio: "06:00", horaFin: "06:45", temporada: "2027-T1" },
      { dia: "miercoles", horaInicio: "18:00", horaFin: "18:45", temporada: "2027-T1" },
    ],
  },
  {
    nombre: "Yoga Restaurativo", codigo: "YOG-201", nivel: "principiante", instructor: "Luis Paredes",
    cupo: 15, duracionMinutos: 60, equipamiento: ["mat", "bloque"],
    descripcion: "Posturas suaves y respiración para recuperar el cuerpo.",
    horarios: [
      { dia: "martes", horaInicio: "07:00", horaFin: "08:00", temporada: "2027-T1" },
      { dia: "jueves", horaInicio: "07:00", horaFin: "08:00", temporada: "2027-T1" },
    ],
  },
  {
    nombre: "Crossfit Avanzado", codigo: "CRF-301", nivel: "avanzado", instructor: "Ana Ruiz",
    cupo: 12, duracionMinutos: 60, equipamiento: ["kettlebell", "barra", "cuerda"],
    descripcion: "Entrenamiento funcional de alta exigencia; requiere experiencia previa.",
    horarios: [
      { dia: "lunes", horaInicio: "18:00", horaFin: "19:00", temporada: "2027-T1" },
      { dia: "viernes", horaInicio: "18:00", horaFin: "19:00", temporada: "2027-T1" },
      { dia: "sabado", horaInicio: "09:00", horaFin: "10:00", temporada: "2027-T1" },
    ],
  },
];

// [usuario, código de clase, fecha de la sesión (hora local), puntuación o null]
const INSCRIPCIONES = [
  ["socio", "SPN-101", "2027-01-04T06:00:00", { puntuacion: 5, comentario: "Excelente energía de la instructora", etiquetas: ["intensa", "puntual"] }],
  ["socio", "YOG-201", "2027-01-05T07:00:00", { puntuacion: 4, comentario: "Muy relajante, ideal después del trabajo", etiquetas: ["tranquila"] }],
  ["socio", "CRF-301", "2027-01-08T18:00:00", null],
  ["admin", "SPN-101", "2027-01-04T06:00:00", { puntuacion: 4, comentario: "Buena música, sala algo llena", etiquetas: ["intensa"] }],
  ["admin", "CRF-301", "2027-01-04T18:00:00", { puntuacion: 3, comentario: "Muy exigente para empezar", etiquetas: ["dificil"] }],
];

async function main() {
  const tokens = {
    socio: await login("socio@gimnasio.com", "Socio123*"),
    admin: await login("admin@gimnasio.com", "Admin123*"),
  };

  // 1) Catálogo en MongoDB
  const claseId = {};
  for (const clase of CLASES) {
    let { status, datos } = await llamar("POST", "/clases", { token: tokens.admin, body: clase });
    if (status === 409) {
      const r = await llamar("GET", `/clases?q=${encodeURIComponent(clase.nombre)}&fields=_id,codigo`);
      datos = r.datos.clases.find((c) => c.codigo === clase.codigo);
    } else if (status !== 201) {
      throw new Error(`Clase ${clase.codigo}: ${status} ${JSON.stringify(datos)}`);
    }
    claseId[clase.codigo] = datos._id;
    console.log(`Clase ${clase.codigo} → ${datos._id} (${status === 201 ? "creada" : "ya existía"})`);
  }

  // 2) Inscripciones en PostgreSQL (validan la clase en MongoDB) y 3) valoraciones en MongoDB (validan PostgreSQL)
  for (const [usuario, codigo, fechaSesion, valoracion] of INSCRIPCIONES) {
    const token = tokens[usuario];
    let { status, datos } = await llamar("POST", "/inscripciones", {
      token, body: { claseId: claseId[codigo], fechaSesion },
    });
    if (status === 409) {
      const mias = await llamar("GET", "/inscripciones/mias", { token });
      datos = mias.datos.inscripciones.find(
        (i) => i.claseId === claseId[codigo] && new Date(i.fechaSesion).getTime() === new Date(fechaSesion).getTime(),
      );
    } else if (status !== 201) {
      throw new Error(`Inscripción ${usuario} ${codigo}: ${status} ${JSON.stringify(datos)}`);
    }
    console.log(`Inscripción #${datos.id}: ${usuario} en ${codigo} (${fechaSesion})`);

    if (valoracion) {
      const r = await llamar("POST", "/valoraciones", { token, body: { inscripcionId: datos.id, ...valoracion } });
      console.log(`  Valoración ${valoracion.puntuacion}★ → ${r.status === 201 ? "creada" : r.status === 409 ? "ya existía" : r.status}`);
    }
  }

  const resumen = await llamar("GET", "/valoraciones/resumen");
  console.log("\nResumen de valoraciones por clase:");
  console.table(resumen.datos);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
