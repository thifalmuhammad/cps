const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');

// Create Productivity
const createProductivity = async (req, res) => {
  try {
    const { farmId, harvestDate, productionAmount, sellingPrice, productivity } = req.body;

    if (!farmId || !harvestDate || !productionAmount || !sellingPrice || !productivity) {
      return res.status(400).json({
        success: false,
        message: 'All productivity fields are required',
      });
    }

    const record = await prisma.productivity.create({
      data: {
        uuid: uuidv4(),
        farmId,
        harvestDate: new Date(harvestDate),
        productionAmount: parseFloat(productionAmount),
        sellingPrice: parseFloat(sellingPrice),
        productivity: parseFloat(productivity),
      },
      include: {
        farm: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Productivity record created successfully',
      data: record,
    });
  } catch (error) {
    console.error('Create productivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get all productivity records
const getAllProductivities = async (req, res) => {
  try {
    const records = await prisma.productivity.findMany({
      include: {
        farm: {
          include: {
            farmer: { select: { uuid: true, name: true } },
            district: true,
          },
        },
      },
    });
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Get productivities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get productivity by UUID
const getProductivityByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const record = await prisma.productivity.findUnique({
      where: { uuid },
      include: {
        farm: {
          include: {
            farmer: { select: { uuid: true, name: true } },
            district: true,
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Productivity record not found',
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Get productivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update productivity
const updateProductivity = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { harvestDate, productionAmount, sellingPrice, productivity } = req.body;

    const record = await prisma.productivity.update({
      where: { uuid },
      data: {
        ...(harvestDate && { harvestDate: new Date(harvestDate) }),
        ...(productionAmount && { productionAmount: parseFloat(productionAmount) }),
        ...(sellingPrice && { sellingPrice: parseFloat(sellingPrice) }),
        ...(productivity && { productivity: parseFloat(productivity) }),
      },
      include: {
        farm: true,
      },
    });

    res.json({
      success: true,
      message: 'Productivity record updated successfully',
      data: record,
    });
  } catch (error) {
    console.error('Update productivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Delete productivity
const deleteProductivity = async (req, res) => {
  try {
    const { uuid } = req.params;

    await prisma.productivity.delete({
      where: { uuid },
    });

    res.json({
      success: true,
      message: 'Productivity record deleted successfully',
    });
  } catch (error) {
    console.error('Delete productivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  createProductivity,
  getAllProductivities,
  getProductivityByUuid,
  updateProductivity,
  deleteProductivity,
};
