const proveedorService = require('../services/proveedor.service');

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// A diferencia de `authorize(...roles)` (que solo mira el rol del token),
// esto es autorización POR DUEÑO: hay que cargar el recurso y comparar
// su usuarioId contra el id del token. Se reutiliza en editar, borrar y
// cambiar disponibilidad -- va DESPUÉS de `authenticate` en la ruta.
//
// De paso, cuelga el proveedor ya cargado en req.proveedor para que el
// controller/service no tengan que volver a buscarlo por id.
// -----------------------------------------------------------------------
async function esDuenoOAdmin(req, res, next) {
  try {
    const proveedor = await proveedorService.obtenerPorId(req.params.id);

    const esDueno = proveedor.usuarioId === req.user.id;
    const esAdmin = req.user.role === 'admin';

    if (!esDueno && !esAdmin) {
      return res.status(403).json({ message: 'No tienes permiso para modificar este proveedor' });
    }

    req.proveedor = proveedor;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = esDuenoOAdmin;
