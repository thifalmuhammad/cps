const express = require('express');
const router = express.Router();
const { createWarehouse, getAllWarehouses, getWarehouseByUuid, updateWarehouse, deleteWarehouse } = require('../controllers/warehouseController');

// Warehouse routes
router.post('/warehouses', createWarehouse);
router.get('/warehouses', getAllWarehouses);
router.get('/warehouses/:uuid', getWarehouseByUuid);
router.put('/warehouses/:uuid', updateWarehouse);
router.delete('/warehouses/:uuid', deleteWarehouse);

module.exports = router;
