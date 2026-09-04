const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const Categoria = require('./categoria.model');

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// Un Proveedor es el PERFIL DE NEGOCIO de un Usuario con role='provider'.
// Se modela como tabla aparte (y no como columnas extra en "users")
// porque es una relación 1:1 OPCIONAL: no todo Usuario tiene perfil de
// proveedor, y este perfil tiene su propio ciclo de vida (verificado,
// destacado, calificación) que no tiene sentido para un cliente.
// -----------------------------------------------------------------------
class Proveedor extends Model {}

Proveedor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // FK única -- garantiza la relación 1:1 a nivel de base de datos,
    // no solo a nivel de lógica de negocio.
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    categoriaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombreNegocio: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: { msg: 'El nombre del negocio es obligatorio' } },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    departamento: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // En Lempiras (HNL).
    precioDesde: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    // Por ahora un campo simple que alimenta el seeder/admin; más
    // adelante se recalculará automáticamente a partir de reseñas.
    calificacion: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      defaultValue: 0,
    },
    totalResenas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // Sello de confianza -- SOLO lo activa un admin (ver proveedor.service.js).
    verificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Alimenta la sección "Destacados" del home -- también exclusivo de admin.
    destacado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // A diferencia de verificado/destacado, esto sí lo controla el propio
    // proveedor (ej. "estoy de vacaciones, no tomo pedidos esta semana").
    disponible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    fotoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Soft delete, mismo patrón que Categoria.
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Proveedor',
    tableName: 'proveedores',
    timestamps: true,
  }
);

// Asociaciones (mismo lugar que en refreshToken.model.js: se declaran
// dentro del archivo del modelo "hijo" de la relación).
Proveedor.belongsTo(User, { foreignKey: 'usuarioId' });
User.hasOne(Proveedor, { foreignKey: 'usuarioId' });

Proveedor.belongsTo(Categoria, { foreignKey: 'categoriaId' });
Categoria.hasMany(Proveedor, { foreignKey: 'categoriaId' });

module.exports = Proveedor;
