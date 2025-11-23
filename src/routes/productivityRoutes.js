const express = require('express');
const router = express.Router();
const { createFarm, getAllFarms, getFarmByUuid, updateFarm, deleteFarm } = require('../controllers/farmController');

// Farm routes
router.post('/farms', createFarm);
router.get('/farms', getAllFarms);
router.get('/farms/:uuid', getFarmByUuid);
router.put('/farms/:uuid', updateFarm);
router.delete('/farms/:uuid', deleteFarm);

module.exports = router;
