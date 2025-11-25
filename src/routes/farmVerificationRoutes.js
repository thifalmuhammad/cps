const express = require('express');
const router = express.Router();
const {
  getPendingFarms,
  verifyFarm,
  rejectFarm,
  getVerifiedFarms
} = require('../controllers/farmVerificationController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`  🔹 [farmVerificationRoutes] ${req.method} ${req.path}`);
  if (req.method === 'PUT' || req.method === 'POST') {
    console.log(`     📦 Body:`, JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

// Farm verification routes
router.get('/farms/pending', getPendingFarms);
router.get('/farms/verified', getVerifiedFarms);
router.put('/farms/:uuid/verify', verifyFarm);
router.put('/farms/:uuid/reject', rejectFarm);

module.exports = router;