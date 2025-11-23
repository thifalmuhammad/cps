const express = require('express');
const router = express.Router();
const { createFarm, getAllFarms, getFarmByUuid, getFarmsByDistrict, updateFarm, deleteFarm } = require('../controllers/farmController');

// Special routes (must come before :uuid routes)
router.get('/districts/:districtId/farms', getFarmsByDistrict);

// Regular farm routes
router.post('/farms', createFarm);
router.get('/farms', getAllFarms);
router.get('/farms/:uuid', getFarmByUuid);
router.put('/farms/:uuid', updateFarm);
router.delete('/farms/:uuid', deleteFarm);

module.exports = router;
