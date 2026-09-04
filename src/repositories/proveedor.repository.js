const Proveedor = require('../models/proveedor.model');
const Categoria = require('../models/categoria.model');
const User = require('../models/user.model');

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// Única capa que sabe hablar con Sequelize para Proveedor (mismo patrón
// que categoria.repository.js). El include de User excluye a propósito
// passwordHash -- un JOIN "ingenuo" traería el hash completo si no se
// limitan los atributos, y eso jamás debe salir en una respuesta HTTP.
// -----------------------------------------------------------------------
const INCLUDE_RELACIONES = [
  { model: Categoria, attributes: ['id', 'nombre', 'icono'] },
  { model: User, attributes: ['id', 'fullName', 'email'] },
];

class ProveedorRepository {
  async findAll({ categoriaId, ciudad, disponible, verificado, destacado, activo } = {}) {
    const where = {};
    if (categoriaId !== undefined) where.categoriaId = categoriaId;
    if (ciudad !== undefined) where.ciudad = ciudad;
    if (disponible !== undefined) where.disponible = disponible;
    if (verificado !== undefined) where.verificado = verificado;
    if (destacado !== undefined) where.destacado = destacado;
    if (activo !== undefined) where.activo = activo;

    return Proveedor.findAll({
      where,
      include: INCLUDE_RELACIONES,
      order: [['calificacion', 'DESC']],
    });
  }

  async findById(id) {
    return Proveedor.findByPk(id, { include: INCLUDE_RELACIONES });
  }

  // Para validar el 1:1 al crear (un usuario no puede tener 2 perfiles).
  async findByUsuarioId(usuarioId) {
    return Proveedor.findOne({ where: { usuarioId } });
  }

  async create({
    usuarioId,
    categoriaId,
    nombreNegocio,
    descripcion,
    telefono,
    ciudad,
    departamento,
    precioDesde,
    fotoUrl,
  }) {
    return Proveedor.create({
      usuarioId,
      categoriaId,
      nombreNegocio,
      descripcion,
      telefono,
      ciudad,
      departamento,
      precioDesde,
      fotoUrl,
    });
  }

  async update(proveedor, cambios) {
    return proveedor.update(cambios);
  }

  // Soft delete: nunca se borra el registro -- solicitudes/reseñas
  // futuras pueden referenciar al proveedor por id.
  async softDelete(proveedor) {
    return proveedor.update({ activo: false });
  }
}

module.exports = new ProveedorRepository();
