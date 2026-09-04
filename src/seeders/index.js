require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/user.model');
const Categoria = require('../models/categoria.model');
const Proveedor = require('../models/proveedor.model');
// RefreshToken no se siembra, pero su modelo debe registrarse para que
// Sequelize conozca la asociación User.hasMany(RefreshToken) al hacer
// sync() -- si no, la tabla refresh_tokens nunca se crea.
require('../models/refreshToken.model');
const RefreshToken = require('../models/refreshToken.model');
const { hashPassword } = require('../utils/password');
const { seedCategorias } = require('./categoria.seeder');

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// Este es el SEEDER MAESTRO: orquesta todo lo necesario para poder
// probar el login, los endpoints y el home de la app Flutter de punta a
// punta con un solo comando. Respeta el mismo mecanismo de hasheo que
// usa el registro real (AuthService -> hashPassword con bcrypt, ver
// src/utils/password.js) -- NO es un hook del modelo, así que acá
// también hay que hashear "a mano" antes de guardar, igual que hace
// AuthService.register().
//
// Es idempotente por defecto (findOrCreate: correrlo 10 veces no
// duplica nada). Con --reset borra las tablas relacionadas primero
// (ver función reset()) para partir de una base limpia -- SOLO usar en
// desarrollo, nunca en producción.
//
// Uso:
//   node src/seeders/index.js            (o: npm run seed)
//   node src/seeders/index.js --reset    (o: npm run seed:reset)
// -----------------------------------------------------------------------

const RESET = process.argv.includes('--reset');

// Contraseña única para TODOS los usuarios de prueba -- a propósito
// simple, para que sea fácil loguearse manualmente mientras se prueba
// la app. Nunca se usa este patrón fuera de un seed de desarrollo.
const PASSWORD_PRUEBA = 'Fixit123';

const USUARIOS_BASE = [
  { fullName: 'Administración FixIt', email: 'admin@fixit.hn', role: 'admin' },
  // OJO: sin puntos antes de "@gmail.com" a propósito -- la ruta de
  // login corre `.normalizeEmail()` (express-validator), que para Gmail
  // ELIMINA los puntos del local-part antes de buscar en BD. Si acá
  // guardáramos "maria.lopez@gmail.com" tal cual, el login real jamás
  // lo encontraría (buscaría "marialopez@gmail.com"). Sembramos ya en
  // la forma normalizada, igual que quedaría tras un registro real.
  { fullName: 'María López', email: 'marialopez@gmail.com', role: 'client' },
  { fullName: 'Carlos Mejía', email: 'carlosmejia@gmail.com', role: 'client' },
];

// Los 4 proveedores pedidos, con variedad a propósito para poder
// probar filtros y badges del home: 2 destacados, 1 no verificado y
// 1 no disponible.
const PROVEEDORES = [
  {
    // Emails sin puntos antes de "@gmail.com" -- ver nota en USUARIOS_BASE
    // sobre `.normalizeEmail()` en la ruta de login.
    usuario: { fullName: 'José Ramón López', email: 'joselopezhidro@gmail.com' },
    categoriaNombre: 'Plomería',
    perfil: {
      nombreNegocio: 'Servicios Hidro López',
      descripcion:
        'Reparación de tuberías, grifería y sanitarios a domicilio en La Ceiba y alrededores.',
      telefono: '+504 9911-2233',
      ciudad: 'La Ceiba',
      departamento: 'Atlántida',
      precioDesde: 350,
      calificacion: 4.9,
      totalResenas: 41,
      verificado: true,
      destacado: true,
      disponible: true,
    },
  },
  {
    usuario: { fullName: 'Carlos Alberto Martínez', email: 'carloselectrosoluciones@gmail.com' },
    categoriaNombre: 'Electricidad',
    perfil: {
      nombreNegocio: 'Electro Soluciones HN',
      descripcion:
        'Instalaciones eléctricas residenciales y comerciales, cableado y reparación de cortocircuitos.',
      telefono: '+504 9822-1144',
      ciudad: 'San Pedro Sula',
      departamento: 'Cortés',
      precioDesde: 500,
      calificacion: 4.8,
      totalResenas: 52,
      verificado: true,
      destacado: false,
      disponible: true,
    },
  },
  {
    usuario: { fullName: 'Miguel Ángel Reyes', email: 'miguelmaderafina@gmail.com' },
    categoriaNombre: 'Carpintería',
    perfil: {
      nombreNegocio: 'MaderaFina Carpintería',
      descripcion: 'Fabricación de muebles a medida y reparación de estructuras de madera.',
      telefono: '+504 9933-5566',
      ciudad: 'La Ceiba',
      departamento: 'Atlántida',
      precioDesde: 600,
      calificacion: 4.7,
      totalResenas: 19,
      verificado: false,
      destacado: false,
      disponible: true,
    },
  },
  {
    usuario: { fullName: 'Sandra Paredes', email: 'sandrapinturasceiba@gmail.com' },
    categoriaNombre: 'Pintura',
    perfil: {
      nombreNegocio: 'Pinturas y Acabados Ceiba',
      descripcion:
        'Pintura de interiores, exteriores y acabados decorativos para hogares y negocios.',
      telefono: '+504 9944-7788',
      ciudad: 'La Ceiba',
      departamento: 'Atlántida',
      precioDesde: 400,
      calificacion: 4.6,
      totalResenas: 27,
      verificado: true,
      destacado: true,
      disponible: false,
    },
  },
];

// Todos los correos que este seeder puede llegar a crear (usuarios base
// + dueños de los proveedores) -- se usa para el resumen final y para
// que --reset solo toque lo que le corresponde a este seed.
const TODOS_LOS_EMAILS = [
  ...USUARIOS_BASE.map((u) => u.email),
  ...PROVEEDORES.map((p) => p.usuario.email),
];

// -----------------------------------------------------------------------
// --reset: vacía las tablas involucradas en orden seguro respecto a las
// llaves foráneas (refresh_tokens y proveedores dependen de usuarios;
// proveedores además depende de categorías). ES DESTRUCTIVO -- borra
// TODO el contenido de esas tablas, no solo lo sembrado por este
// script. Pensado únicamente para bases de datos de desarrollo.
// -----------------------------------------------------------------------
async function reset() {
  console.log('⚠️  --reset: vaciando tablas (refresh_tokens, proveedores, usuarios, categorías)...');
  await RefreshToken.destroy({ where: {}, truncate: true, cascade: true });
  await Proveedor.destroy({ where: {}, truncate: true, cascade: true });
  await User.destroy({ where: {}, truncate: true, cascade: true });
  await Categoria.destroy({ where: {}, truncate: true, cascade: true });
  console.log('🧹 Tablas vaciadas.\n');
}

async function seedUsuariosBase(passwordHash) {
  const creados = [];
  for (const datos of USUARIOS_BASE) {
    const [user, fueCreado] = await User.findOrCreate({
      where: { email: datos.email },
      defaults: { ...datos, passwordHash },
    });
    console.log(
      fueCreado ? `✅ Usuario creado (${user.role}): ${user.email}` : `↪️  Ya existía (${user.role}): ${user.email}`
    );
    creados.push(user);
  }
  return creados;
}

async function seedProveedores(passwordHash) {
  const creados = [];
  for (const { usuario, categoriaNombre, perfil } of PROVEEDORES) {
    const categoria = await Categoria.findOne({ where: { nombre: categoriaNombre } });
    if (!categoria) {
      console.warn(`⚠️  Categoría "${categoriaNombre}" no encontrada -- se omite ${perfil.nombreNegocio}.`);
      continue;
    }

    const [user, userCreado] = await User.findOrCreate({
      where: { email: usuario.email },
      defaults: { ...usuario, passwordHash, role: 'provider' },
    });
    console.log(
      userCreado ? `✅ Usuario creado (provider): ${user.email}` : `↪️  Ya existía (provider): ${user.email}`
    );

    const [proveedor, proveedorCreado] = await Proveedor.findOrCreate({
      where: { usuarioId: user.id },
      defaults: { ...perfil, usuarioId: user.id, categoriaId: categoria.id },
    });
    console.log(
      proveedorCreado
        ? `✅ Perfil de proveedor creado: ${proveedor.nombreNegocio}`
        : `↪️  Perfil de proveedor ya existía: ${proveedor.nombreNegocio}`
    );

    creados.push({ user, proveedor });
  }
  return creados;
}

function imprimirResumen(usuariosBase, proveedores) {
  console.log('\n===================================================================');
  console.log('🌱 SEED MAESTRO COMPLETADO -- credenciales de prueba (solo desarrollo)');
  console.log('===================================================================');
  console.log(`Contraseña para TODOS los usuarios: ${PASSWORD_PRUEBA}\n`);

  const filas = [
    ...usuariosBase.map((u) => ({ rol: u.role, email: u.email, negocio: '-' })),
    ...proveedores.map(({ user, proveedor }) => ({
      rol: 'provider',
      email: user.email,
      negocio: proveedor.nombreNegocio,
    })),
  ];

  const anchoRol = Math.max(4, ...filas.map((f) => f.rol.length));
  const anchoEmail = Math.max(5, ...filas.map((f) => f.email.length));
  const anchoNegocio = Math.max(7, ...filas.map((f) => f.negocio.length));

  const fila = (rol, email, negocio) =>
    `${rol.padEnd(anchoRol)} | ${email.padEnd(anchoEmail)} | ${negocio.padEnd(anchoNegocio)}`;

  console.log(fila('rol', 'email', 'negocio'));
  console.log('-'.repeat(anchoRol + anchoEmail + anchoNegocio + 6));
  for (const f of filas) console.log(fila(f.rol, f.email, f.negocio));

  console.log('\nResumen de proveedores (para probar filtros/badges del home):');
  for (const { proveedor } of proveedores) {
    console.log(
      `  - ${proveedor.nombreNegocio}: verificado=${proveedor.verificado} destacado=${proveedor.destacado} disponible=${proveedor.disponible} calificacion=${proveedor.calificacion}`
    );
  }
  console.log('===================================================================\n');
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida.');

    // Asegura que las tablas existan (no destructivo: no usa `alter`,
    // solo crea lo que falte -- igual que arrancar el server una vez
    // en desarrollo, pero sin depender de eso).
    await sequelize.sync();

    if (RESET) {
      await reset();
    }

    console.log('--- 1) Categorías ---');
    await seedCategorias();

    const passwordHash = await hashPassword(PASSWORD_PRUEBA);

    console.log('\n--- 2) Usuarios base (admin + clientes) ---');
    const usuariosBase = await seedUsuariosBase(passwordHash);

    console.log('\n--- 3) Proveedores (usuario + perfil) ---');
    const proveedores = await seedProveedores(passwordHash);

    imprimirResumen(usuariosBase, proveedores);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar el seed maestro:', error);
    process.exit(1);
  }
}

seed();

module.exports = { USUARIOS_BASE, PROVEEDORES, TODOS_LOS_EMAILS, PASSWORD_PRUEBA };
