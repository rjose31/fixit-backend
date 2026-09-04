const proveedorRepository = require('../repositories/proveedor.repository');
const categoriaRepository = require('../repositories/categoria.repository');

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// Lógica de negocio de Proveedores. No conoce req/res -- los errores de
// dominio se lanzan con `error.statusCode`, igual que en
// categoria.service.js / auth.service.js.
// -----------------------------------------------------------------------
const CAMPOS_EDITABLES = [
  'categoriaId',
  'nombreNegocio',
  'descripcion',
  'telefono',
  'ciudad',
  'departamento',
  'precioDesde',
  'fotoUrl',
];

class ProveedorService {
  async listar({ categoriaId, ciudad, disponible, verificado, destacado } = {}) {
    // El home/búsqueda pública solo debe ver proveedores activos --
    // por eso "activo" no es un filtro expuesto, siempre es true.
    return proveedorRepository.findAll({
      categoriaId,
      ciudad,
      disponible,
      verificado,
      destacado,
      activo: true,
    });
  }

  async obtenerPorId(id) {
    const proveedor = await proveedorRepository.findById(id);
    if (!proveedor) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return proveedor;
  }

  async crear(usuarioId, datos) {
    // 1:1 -- un usuario no puede tener dos perfiles de proveedor.
    const perfilExistente = await proveedorRepository.findByUsuarioId(usuarioId);
    if (perfilExistente) {
      const error = new Error('Este usuario ya tiene un perfil de proveedor');
      error.statusCode = 409;
      throw error;
    }

    const categoria = await categoriaRepository.findById(datos.categoriaId);
    if (!categoria) {
      const error = new Error('La categoría indicada no existe');
      error.statusCode = 400;
      throw error;
    }

    try {
      const proveedor = await proveedorRepository.create({ ...datos, usuarioId });
      return proveedorRepository.findById(proveedor.id);
    } catch (err) {
      throw this._traducirErrorSequelize(err);
    }
  }

  // `esAdmin` decide si se permite tocar verificado/destacado -- el
  // dueño del perfil NO puede auto-certificarse ni auto-destacarse,
  // esos campos se ignoran silenciosamente si quien edita no es admin.
  async actualizar(id, cambiosCrudos, esAdmin) {
    const proveedor = await this.obtenerPorId(id);

    if (cambiosCrudos.categoriaId !== undefined) {
      const categoria = await categoriaRepository.findById(cambiosCrudos.categoriaId);
      if (!categoria) {
        const error = new Error('La categoría indicada no existe');
        error.statusCode = 400;
        throw error;
      }
    }

    const cambios = {};
    for (const campo of CAMPOS_EDITABLES) {
      if (cambiosCrudos[campo] !== undefined) cambios[campo] = cambiosCrudos[campo];
    }

    if (esAdmin) {
      if (cambiosCrudos.verificado !== undefined) cambios.verificado = cambiosCrudos.verificado;
      if (cambiosCrudos.destacado !== undefined) cambios.destacado = cambiosCrudos.destacado;
    }

    try {
      await proveedorRepository.update(proveedor, cambios);
      return proveedorRepository.findById(id);
    } catch (err) {
      throw this._traducirErrorSequelize(err);
    }
  }

  async eliminar(id) {
    const proveedor = await this.obtenerPorId(id);
    return proveedorRepository.softDelete(proveedor);
  }

  // SOLO admin llega hasta acá (ver authorize('admin') en las rutas).
  async verificar(id) {
    const proveedor = await this.obtenerPorId(id);
    await proveedorRepository.update(proveedor, { verificado: true });
    return proveedorRepository.findById(id);
  }

  async cambiarDisponibilidad(id) {
    const proveedor = await this.obtenerPorId(id);
    await proveedorRepository.update(proveedor, { disponible: !proveedor.disponible });
    return proveedorRepository.findById(id);
  }

  // Traduce errores de validación/unicidad de Sequelize a errores de
  // dominio con statusCode 400, igual que categoria.service.js.
  _traducirErrorSequelize(err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const mensaje = err.errors?.[0]?.message || 'Datos de proveedor inválidos';
      const error = new Error(mensaje);
      error.statusCode = 400;
      return error;
    }
    return err;
  }
}

module.exports = new ProveedorService();
