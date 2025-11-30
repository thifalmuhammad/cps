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

    const warehouse = await prisma.warehouse.create({
      data: {
        uuid: uuidv4(),
        warehouseName: `Warehouse - ${storageLocation}`,
        location: storageLocation,
        productivityId,
        quantityStored: parseFloat(quantityStored),
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

    const warehouse = await prisma.warehouse.update({
      where: { uuid },
      data: {
        ...(data.productivityId && { productivityId: data.productivityId }),
        ...(data.quantityStored && { quantityStored: parseFloat(data.quantityStored) }),
        ...(data.storageLocation && { storageLocation: data.storageLocation }),
        ...(data.dateStored && { dateStored: new Date(data.dateStored) }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.quantityRemoved !== undefined && { quantityRemoved: data.quantityRemoved ? parseFloat(data.quantityRemoved) : null }),
        ...(data.removalReason && { removalReason: data.removalReason }),
        ...(data.dateRemoved && { dateRemoved: new Date(data.dateRemoved) }),
        ...(data.buyerInfo !== undefined && { buyerInfo: data.buyerInfo }),
      },
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
