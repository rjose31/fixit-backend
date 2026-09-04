const { Router } = require('express');
const authRoutes = require('./auth.routes');
const categoriaRoutes = require('./categoria.routes');
const proveedorRoutes = require('./proveedor.routes');

const router = Router();

// A medida que avancemos semanas, aquí se van sumando:
// router.use('/users', userRoutes);
// router.use('/services', serviceRoutes);
// router.use('/requests', requestRoutes);
router.use('/auth', authRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/proveedores', proveedorRoutes);

module.exports = router;
