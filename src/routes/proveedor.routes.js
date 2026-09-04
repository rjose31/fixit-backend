const { Router } = require('express');
const { body } = require('express-validator');
const proveedorController = require('../controllers/proveedor.controller');
const handleValidationErrors = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/authenticate');
const esDuenoOAdmin = require('../middlewares/esDuenoOAdmin');

const router = Router();

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// GET / y GET /:id quedan abiertas -- el home y la búsqueda de
// proveedores las consumen sin necesidad de login. Crear un perfil sí
// requiere estar autenticado Y tener role='provider' (un cliente no
// puede publicarse como proveedor). Editar/borrar/cambiar disponibilidad
// exigen además ser el DUEÑO del perfil o un admin (ver
// middlewares/esDuenoOAdmin.js). Verificar es exclusivo de admin: es un
// sello de confianza que el proveedor no puede auto-otorgarse.
// -----------------------------------------------------------------------

const VALIDACIONES_PERFIL = [
  body('descripcion').optional({ checkFalsy: true }).trim(),
  body('telefono')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar los 20 caracteres'),
  body('ciudad')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('La ciudad no puede superar los 100 caracteres'),
  body('departamento')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('El departamento no puede superar los 100 caracteres'),
  body('precioDesde')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('precioDesde debe ser un número mayor o igual a 0'),
  body('fotoUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('fotoUrl debe ser una URL válida'),
];

router.get('/', proveedorController.listarProveedores);
router.get('/:id', proveedorController.obtenerProveedor);

router.post(
  '/',
  authenticate,
  authorize('provider'),
  [
    body('categoriaId')
      .notEmpty().withMessage('La categoría es obligatoria')
      .isInt().withMessage('categoriaId debe ser un número entero'),
    body('nombreNegocio')
      .trim()
      .notEmpty().withMessage('El nombre del negocio es obligatorio')
      .isLength({ max: 150 }).withMessage('El nombre del negocio no puede superar los 150 caracteres'),
    ...VALIDACIONES_PERFIL,
  ],
  handleValidationErrors,
  proveedorController.crearProveedor
);

router.put(
  '/:id',
  authenticate,
  esDuenoOAdmin,
  [
    body('categoriaId')
      .optional()
      .isInt().withMessage('categoriaId debe ser un número entero'),
    body('nombreNegocio')
      .optional()
      .trim()
      .notEmpty().withMessage('El nombre del negocio no puede quedar vacío')
      .isLength({ max: 150 }).withMessage('El nombre del negocio no puede superar los 150 caracteres'),
    ...VALIDACIONES_PERFIL,
    // El proveedor puede mandar estos campos en el body, pero el Service
    // los ignora si quien edita no es admin (ver proveedor.service.js).
    body('verificado').optional().isBoolean().withMessage('verificado debe ser true o false'),
    body('destacado').optional().isBoolean().withMessage('destacado debe ser true o false'),
  ],
  handleValidationErrors,
  proveedorController.actualizarProveedor
);

router.delete('/:id', authenticate, esDuenoOAdmin, proveedorController.eliminarProveedor);

router.patch(
  '/:id/disponibilidad',
  authenticate,
  esDuenoOAdmin,
  proveedorController.cambiarDisponibilidad
);

router.patch(
  '/:id/verificar',
  authenticate,
  authorize('admin'),
  proveedorController.verificarProveedor
);

module.exports = router;
