const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');

// Create Warehouse
const createWarehouse = async (req, res) => {
  try {
    const { warehouseName, location } = req.body;

    if (!warehouseName || !location) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse name and location are required',
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        uuid: uuidv4(),
        warehouseName,
        location,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
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
    const { warehouseName, location } = req.body;

    const warehouse = await prisma.warehouse.update({
      where: { uuid },
      data: {
        ...(warehouseName && { warehouseName }),
        ...(location && { location }),
      },
    });

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
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
