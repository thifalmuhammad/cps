const express = require('express');
const router = express.Router();
const { 
  getPendingFarms, 
  verifyFarm, 
  rejectFarm, 
  getVerifiedFarms 
} = require('../controllers/farmVerificationController');

// Farm verification routes
router.get('/farms/pending', getPendingFarms);
router.get('/farms/verified', getVerifiedFarms);
router.put('/farms/:uuid/verify', verifyFarm);
router.put('/farms/:uuid/reject', rejectFarm);

module.exports = router;