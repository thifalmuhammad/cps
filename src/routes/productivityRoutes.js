const express = require('express');
const router = express.Router();
const { createProductivity, getAllProductivities, getProductivityByUuid, updateProductivity, deleteProductivity } = require('../controllers/productivityController');

// Productivity routes
router.post('/productivities', createProductivity);
router.get('/productivities', getAllProductivities);
router.get('/productivities/:uuid', getProductivityByUuid);
router.put('/productivities/:uuid', updateProductivity);
router.delete('/productivities/:uuid', deleteProductivity);

module.exports = router;
