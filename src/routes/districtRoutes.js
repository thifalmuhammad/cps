const express = require('express');
const router = express.Router();
const { createDistrict, getAllDistricts, getDistrictByUuid, updateDistrict, deleteDistrict } = require('../controllers/districtController');

// District routes
router.post('/districts', createDistrict);
router.get('/districts', getAllDistricts);
router.get('/districts/:uuid', getDistrictByUuid);
router.put('/districts/:uuid', updateDistrict);
router.delete('/districts/:uuid', deleteDistrict);

module.exports = router;
