const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const districtRoutes = require('./districtRoutes');
const farmRoutes = require('./farmRoutes');
const farmVerificationRoutes = require('./farmVerificationRoutes');
const productivityRoutes = require('./productivityRoutes');
const warehouseRoutes = require('./warehouseRoutes');

// Use all routes
router.use(userRoutes);
router.use(districtRoutes);
router.use(farmRoutes);
router.use(farmVerificationRoutes);
router.use(productivityRoutes);
router.use(warehouseRoutes);

// Test DB connection route
router.get('/test-db', async (req, res) => {
  try {
    const prisma = require('../lib/prisma');
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.json({ success: true, time: result[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;