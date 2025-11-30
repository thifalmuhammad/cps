const express = require('express');
const router = express.Router();
const { createWarehouse, getAllWarehouses, getWarehouseByUuid, updateWarehouse, deleteWarehouse } = require('../controllers/warehouseController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`  🔹 [warehouseRoutes] ${req.method} ${req.path}`);
  if (req.method === 'PUT' || req.method === 'POST') {
    console.log(`     📦 Body:`, JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

// Warehouse routes
router.post('/warehouses', createWarehouse);
router.get('/warehouses', getAllWarehouses);
router.get('/warehouses/:uuid', getWarehouseByUuid);
router.put('/warehouses/:uuid', updateWarehouse);
router.delete('/warehouses/:uuid', deleteWarehouse);

module.exports = router;