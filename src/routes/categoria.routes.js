const { Router } = require('express');
const { body } = require('express-validator');
const categoriaController = require('../controllers/categoria.controller');
const handleValidationErrors = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/authenticate');

const router = Router();

// -----------------------------------------------------------------------
// CONTEXTO PARA EL ESTUDIANTE:
// El catálogo de categorías lo consume la app (Flutter) sin necesidad
// de login -- por eso GET / y GET /:id quedan abiertas. Crear, editar o
// desactivar categorías sí requiere ser admin, porque afecta el
// catálogo que ven TODOS los usuarios (clientes y proveedores).
// -----------------------------------------------------------------------
//Este es un cambio cualquier solo para disparar el flujo de trabajo de GitHub Actions. No tiene relevancia para el proyecto.
router.get('/', authenticate,categoriaController.listarCategorias);
router.get('/:id', authenticate, categoriaController.obtenerCategoria);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ max: 100 }).withMessage('El nombre no puede superar los 100 caracteres'),
    body('descripcion')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 255 }).withMessage('La descripción no puede superar los 255 caracteres'),
    body('icono')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 50 }).withMessage('El ícono no puede superar los 50 caracteres'),
  ],
  handleValidationErrors,
  categoriaController.crearCategoria
);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    body('nombre')
      .optional()
      .trim()
      .notEmpty().withMessage('El nombre no puede quedar vacío')
      .isLength({ max: 100 }).withMessage('El nombre no puede superar los 100 caracteres'),
    body('descripcion')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 255 }).withMessage('La descripción no puede superar los 255 caracteres'),
    body('icono')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 50 }).withMessage('El ícono no puede superar los 50 caracteres'),
    body('activo')
      .optional()
      .isBoolean().withMessage('activo debe ser true o false'),
  ],
  handleValidationErrors,
  categoriaController.actualizarCategoria
);

router.delete('/:id', authenticate, authorize('admin'), categoriaController.eliminarCategoria);

module.exports = router;
