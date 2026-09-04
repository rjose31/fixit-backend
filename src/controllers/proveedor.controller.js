const proveedorService = require('../services/proveedor.service');

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// Controller delgado (mismo estilo que categoria.controller.js): lee el
// request, llama al Service correcto, decide status code + forma de la
// respuesta. Cero lógica de negocio aquí.
// -----------------------------------------------------------------------
class ProveedorController {
  async listarProveedores(req, res, next) {
    try {
      const { categoriaId, ciudad, disponible, verificado, destacado } = req.query;
      const filtro = {};
      if (categoriaId !== undefined) filtro.categoriaId = categoriaId;
      if (ciudad !== undefined) filtro.ciudad = ciudad;
      if (disponible !== undefined) filtro.disponible = disponible === 'true';
      if (verificado !== undefined) filtro.verificado = verificado === 'true';
      if (destacado !== undefined) filtro.destacado = destacado === 'true';

      const proveedores = await proveedorService.listar(filtro);
      res.status(200).json(proveedores);
    } catch (err) {
      next(err);
    }
  }

  async obtenerProveedor(req, res, next) {
    try {
      const proveedor = await proveedorService.obtenerPorId(req.params.id);
      res.status(200).json(proveedor);
    } catch (err) {
      next(err);
    }
  }

  async crearProveedor(req, res, next) {
    try {
      const {
        categoriaId,
        nombreNegocio,
        descripcion,
        telefono,
        ciudad,
        departamento,
        precioDesde,
        fotoUrl,
      } = req.body;

      // usuarioId SIEMPRE sale del token, nunca del body -- si no, cualquiera
      // podría crear un perfil de proveedor "a nombre de" otro usuario.
      const proveedor = await proveedorService.crear(req.user.id, {
        categoriaId,
        nombreNegocio,
        descripcion,
        telefono,
        ciudad,
        departamento,
        precioDesde,
        fotoUrl,
      });
      res.status(201).json(proveedor);
    } catch (err) {
      next(err);
    }
  }

  async actualizarProveedor(req, res, next) {
    try {
      const esAdmin = req.user.role === 'admin';
      const proveedor = await proveedorService.actualizar(req.params.id, req.body, esAdmin);
      res.status(200).json(proveedor);
    } catch (err) {
      next(err);
    }
  }

  async eliminarProveedor(req, res, next) {
    try {
      await proveedorService.eliminar(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async verificarProveedor(req, res, next) {
    try {
      const proveedor = await proveedorService.verificar(req.params.id);
      res.status(200).json(proveedor);
    } catch (err) {
      next(err);
    }
  }

  async cambiarDisponibilidad(req, res, next) {
    try {
      const proveedor = await proveedorService.cambiarDisponibilidad(req.params.id);
      res.status(200).json(proveedor);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProveedorController();
