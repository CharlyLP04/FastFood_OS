const express = require('express');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const userRoutes = require('./userRoutes');
const configRoutes = require('./configRoutes');
const searchRoutes = require('./searchRoutes');

const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    estado: 'ok',
    proyecto: 'FastFood OS',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/productos', productRoutes);
router.use('/pedidos', orderRoutes);
router.use('/pagos', paymentRoutes);
router.use('/inventario', inventoryRoutes);
router.use('/usuarios', userRoutes);
router.use('/configuracion', configRoutes);
router.use('/search', searchRoutes);

module.exports = router;
