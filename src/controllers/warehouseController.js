const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');

// Create Warehouse
const createWarehouse = async (req, res) => {
  try {
    const { productivityId, quantityStored, storageLocation, dateStored, notes } = req.body;

    if (!productivityId || !quantityStored || !storageLocation || !dateStored) {
      return res.status(400).json({
        success: false,
        message: 'Productivity ID, quantity stored, storage location, and date stored are required',
      });
    }

    // Validate quantityStored is not negative
    const parsedQuantityStored = parseFloat(quantityStored);
    if (isNaN(parsedQuantityStored) || parsedQuantityStored < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity stored must be a positive number',
      });
    }

    // Get productivity record to check production amount
    const productivity = await prisma.productivity.findUnique({
      where: { uuid: productivityId },
      select: { productionAmount: true, uuid: true }
    });

    if (!productivity) {
      return res.status(404).json({
        success: false,
        message: 'Productivity record not found',
      });
    }

    // Check total quantity already stored for this productivity
    const existingWarehouses = await prisma.warehouse.findMany({
      where: { productivityId },
      select: { quantityStored: true, quantityRemoved: true }
    });

    const totalStored = existingWarehouses.reduce((sum, w) => {
      const stored = w.quantityStored || 0;
      const removed = w.quantityRemoved || 0;
      return sum + (stored - removed);
    }, 0);

    const availableAmount = productivity.productionAmount - totalStored;

    // Validate quantityStored doesn't exceed available production amount
    if (parsedQuantityStored > availableAmount) {
      return res.status(400).json({
        success: false,
        message: `Quantity stored (${parsedQuantityStored}) cannot exceed available production amount (${availableAmount.toFixed(2)}). Production amount: ${productivity.productionAmount}, Already stored: ${totalStored.toFixed(2)}`,
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        uuid: uuidv4(),
        warehouseName: `Warehouse - ${storageLocation}`,
        location: storageLocation,
        productivityId,
        quantityStored: parsedQuantityStored,
        storageLocation,
        dateStored: new Date(dateStored),
        notes: notes || '',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse inventory created successfully',
      data: warehouse,
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get all warehouses
const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany();
    res.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get warehouse by UUID
const getWarehouseByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { uuid },
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    res.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update warehouse
const updateWarehouse = async (req, res) => {
  try {
    const { uuid } = req.params;
    const data = req.body;

    // Get current warehouse to check productivity
    const currentWarehouse = await prisma.warehouse.findUnique({
      where: { uuid },
      select: { productivityId: true, quantityStored: true }
    });

    if (!currentWarehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    const productivityId = data.productivityId || currentWarehouse.productivityId;
    const updateData = {};

    // Validate and add productivityId if provided
    if (data.productivityId) {
      updateData.productivityId = data.productivityId;
    }

    // Validate and add quantityStored if provided
    if (data.quantityStored !== undefined) {
      const parsedQuantityStored = parseFloat(data.quantityStored);
      if (isNaN(parsedQuantityStored) || parsedQuantityStored < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity stored must be a positive number',
        });
      }

      // Get productivity record to check production amount
      const productivity = await prisma.productivity.findUnique({
        where: { uuid: productivityId },
        select: { productionAmount: true }
      });

      if (!productivity) {
        return res.status(404).json({
          success: false,
          message: 'Productivity record not found',
        });
      }

      // Check total quantity already stored for this productivity (excluding current warehouse)
      const existingWarehouses = await prisma.warehouse.findMany({
        where: { 
          productivityId,
          uuid: { not: uuid } // Exclude current warehouse
        },
        select: { quantityStored: true, quantityRemoved: true }
      });

      const totalStored = existingWarehouses.reduce((sum, w) => {
        const stored = w.quantityStored || 0;
        const removed = w.quantityRemoved || 0;
        return sum + (stored - removed);
      }, 0);

      const availableAmount = productivity.productionAmount - totalStored;

      // Validate quantityStored doesn't exceed available production amount
      if (parsedQuantityStored > availableAmount) {
        return res.status(400).json({
          success: false,
          message: `Quantity stored (${parsedQuantityStored}) cannot exceed available production amount (${availableAmount.toFixed(2)}). Production amount: ${productivity.productionAmount}, Already stored in other warehouses: ${totalStored.toFixed(2)}`,
        });
      }

      updateData.quantityStored = parsedQuantityStored;
    }

    // Add other fields if provided
    if (data.storageLocation) {
      updateData.storageLocation = data.storageLocation;
    }
    if (data.dateStored) {
      updateData.dateStored = new Date(data.dateStored);
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.quantityRemoved !== undefined) {
      updateData.quantityRemoved = data.quantityRemoved ? parseFloat(data.quantityRemoved) : null;
    }
    if (data.removalReason) {
      updateData.removalReason = data.removalReason;
    }
    if (data.dateRemoved) {
      updateData.dateRemoved = new Date(data.dateRemoved);
    }
    if (data.buyerInfo !== undefined) {
      updateData.buyerInfo = data.buyerInfo;
    }

    const warehouse = await prisma.warehouse.update({
      where: { uuid },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Warehouse inventory updated successfully',
      data: warehouse,
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Delete warehouse
const deleteWarehouse = async (req, res) => {
  try {
    const { uuid } = req.params;

    await prisma.warehouse.delete({
      where: { uuid },
    });

    res.json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  createWarehouse,
  getAllWarehouses,
  getWarehouseByUuid,
  updateWarehouse,
  deleteWarehouse,
};
