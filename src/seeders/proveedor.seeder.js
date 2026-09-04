require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/user.model');
const Categoria = require('../models/categoria.model');
const Proveedor = require('../models/proveedor.model');
const { hashPassword } = require('../utils/password');

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// El perfil de Proveedor depende de un Usuario (relación 1:1), así que
// este seed primero crea (o encuentra) el Usuario con role='provider' y
// LUEGO su perfil de negocio -- igual que pasaría en el flujo real
// (registro -> POST /api/proveedores). Las contraseñas se hashean con
// bcrypt (mismo helper que usa el registro real), nunca se guardan en
// texto plano ni siquiera en un seed.
//
// Uso: node src/seeders/proveedor.seeder.js
// (Requiere que categoria.seeder.js ya se haya corrido antes.)
// -----------------------------------------------------------------------
const PASSWORD_POR_DEFECTO = 'FixIt2026!';

const PROVEEDORES = [
  {
    usuario: { fullName: 'José Ramón López', email: 'hidrolopez@fixit.hn' },
    categoriaNombre: 'Plomería',
    perfil: {
      nombreNegocio: 'Servicios Hidro López',
      descripcion:
        'Reparación de tuberías, grifería y sanitarios a domicilio en La Ceiba y alrededores.',
      telefono: '+504 9911-2233',
      ciudad: 'La Ceiba',
      departamento: 'Atlántida',
      precioDesde: 350,
      calificacion: 4.7,
      totalResenas: 38,
      verificado: true,
      destacado: true,
    },
  },
  {
    usuario: { fullName: 'Carlos Martínez', email: 'electrosoluciones@fixit.hn' },
    categoriaNombre: 'Electricidad',
    perfil: {
      nombreNegocio: 'Electro Soluciones HN',
      descripcion:
        'Instalaciones eléctricas residenciales y comerciales, cableado y reparación de cortocircuitos.',
      telefono: '+504 9822-1144',
      ciudad: 'San Pedro Sula',
      departamento: 'Cortés',
      precioDesde: 400,
      calificacion: 4.8,
      totalResenas: 52,
      verificado: true,
      destacado: true,
    },
  },
  {
    usuario: { fullName: 'Miguel Ángel Reyes', email: 'maderafina@fixit.hn' },
    categoriaNombre: 'Carpintería',
    perfil: {
      nombreNegocio: 'MaderaFina Carpintería',
      descripcion: 'Fabricación de muebles a medida y reparación de estructuras de madera.',
      telefono: '+504 9933-5566',
      ciudad: 'La Ceiba',
      departamento: 'Atlántida',
      precioDesde: 500,
      calificacion: 4.6,
      totalResenas: 21,
      verificado: true,
      destacado: false,
    },
  },
  {
    usuario: { fullName: 'Sandra Paredes', email: 'pinturasceiba@fixit.hn' },
    categoriaNombre: 'Pintura',
    perfil: {
      nombreNegocio: 'Pinturas y Acabados Ceiba',
      descripcion:
        'Pintura de interiores, exteriores y acabados decorativos para hogares y negocios.',
      telefono: '+504 9944-7788',
      ciudad: 'La Ceiba',
      departamento: 'Atlántida',
      precioDesde: 300,
      calificacion: 4.5,
      totalResenas: 15,
      verificado: false,
      destacado: false,
    },
  },
  {
    usuario: { fullName: 'Fernando Ochoa', email: 'airesfrescos@fixit.hn' },
    categoriaNombre: 'Aire acondicionado',
    perfil: {
      nombreNegocio: 'Aires Frescos Tegucigalpa',
      descripcion:
        'Instalación y mantenimiento de sistemas de climatización residencial y de oficina.',
      telefono: '+504 9955-8899',
      ciudad: 'Tegucigalpa',
      departamento: 'Francisco Morazán',
      precioDesde: 600,
      calificacion: 4.9,
      totalResenas: 47,
      verificado: true,
      destacado: true,
    },
  },
  {
    usuario: { fullName: 'Daniela Núñez', email: 'cerrajeriasps@fixit.hn' },
    categoriaNombre: 'Cerrajería',
    perfil: {
      nombreNegocio: 'Cerrajería Rápida SPS',
      descripcion: 'Apertura de cerraduras, cambio de chapas y sistemas de seguridad para el hogar.',
      telefono: '+504 9966-0011',
      ciudad: 'San Pedro Sula',
      departamento: 'Cortés',
      precioDesde: 250,
      calificacion: 4.5,
      totalResenas: 9,
      verificado: false,
      destacado: false,
    },
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    const passwordHash = await hashPassword(PASSWORD_POR_DEFECTO);

    for (const { usuario, categoriaNombre, perfil } of PROVEEDORES) {
      const categoria = await Categoria.findOne({ where: { nombre: categoriaNombre } });
      if (!categoria) {
        console.warn(
          `⚠️  Categoría "${categoriaNombre}" no encontrada -- corré primero categoria.seeder.js. Se omite ${perfil.nombreNegocio}.`
        );
        continue;
      }

      const [user, userCreado] = await User.findOrCreate({
        where: { email: usuario.email },
        defaults: {
          fullName: usuario.fullName,
          email: usuario.email,
          passwordHash,
          role: 'provider',
        },
      });
      console.log(userCreado ? `✅ Usuario creado: ${user.email}` : `↪️  Usuario ya existía: ${user.email}`);

      const [proveedor, proveedorCreado] = await Proveedor.findOrCreate({
        where: { usuarioId: user.id },
        defaults: { ...perfil, usuarioId: user.id, categoriaId: categoria.id },
      });
      console.log(
        proveedorCreado
          ? `✅ Perfil creado: ${proveedor.nombreNegocio}`
          : `↪️  Perfil ya existía: ${proveedor.nombreNegocio}`
      );
    }

    console.log('🌱 Seed de proveedores completado.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar el seed de proveedores:', error);
    process.exit(1);
  }
}

seed();
