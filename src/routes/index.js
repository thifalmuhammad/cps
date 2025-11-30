const express = require('express');
const router = express.Router();

// Import routes
let userRoutes, districtRoutes, farmVerificationRoutes, farmRoutes, productivityRoutes, warehouseRoutes;

try {
  userRoutes = require('./userRoutes');
  districtRoutes = require('./districtRoutes');
  farmVerificationRoutes = require('./farmVerificationRoutes');
  farmRoutes = require('./farmRoutes');
  productivityRoutes = require('./productivityRoutes');
  warehouseRoutes = require('./warehouseRoutes');
  
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  throw error;
}

// Use all routes
// ⚠️ IMPORTANT: farmVerificationRoutes must come BEFORE farmRoutes
// Because /farms/pending would match /farms/:uuid otherwise
router.use(userRoutes);
router.use(districtRoutes);
router.use(farmVerificationRoutes);  // 👈 MOVED HERE (more specific routes first)
router.use(farmRoutes);
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