const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');

// Create Farm
const createFarm = async (req, res) => {
  try {
    const { districtId, farmArea, elevation, inputCoordinates, plantingYear } = req.body;

    // For now, use a default farmer ID since we don't have auth middleware
    // In production, this should come from req.user.uuid after authentication
    const farmerId = req.body.farmerId || 'default-farmer-uuid';

    if (!districtId || !farmArea || !elevation || !plantingYear) {
      return res.status(400).json({
        success: false,
        message: 'District, farm name, area, elevation, and planting year are required',
      });
    }

    const farm = await prisma.farm.create({
      data: {
        uuid: uuidv4(),
        farmerId,
        districtId,
        farmArea: parseFloat(farmArea),
        elevation: parseFloat(elevation),
        inputCoordinates: inputCoordinates || null,
        plantingYear: parseInt(plantingYear),
      },
      include: {
        farmer: true,
        district: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      data: farm,
    });
  } catch (error) {
    console.error('Create farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get all farms
const getAllFarms = async (req, res) => {
  try {
    const farms = await prisma.farm.findMany({
      include: {
        farmer: { select: { uuid: true, name: true, email: true } },
        district: true,
        productivities: true,
      },
    });
    res.json({
      success: true,
      data: farms,
    });
  } catch (error) {
    console.error('Get farms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get farm by UUID
const getFarmByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const farm = await prisma.farm.findUnique({
      where: { uuid },
      include: {
        farmer: { select: { uuid: true, name: true, email: true } },
        district: true,
        productivities: true,
      },
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    res.json({
      success: true,
      data: farm,
    });
  } catch (error) {
    console.error('Get farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update farm
const updateFarm = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { farmArea, elevation, verifiedGeometry, plantingYear } = req.body;

    const farm = await prisma.farm.update({
      where: { uuid },
      data: {
        ...(farmArea && { farmArea: parseFloat(farmArea) }),
        ...(elevation && { elevation: parseFloat(elevation) }),
        ...(verifiedGeometry && { verifiedGeometry }),
        ...(plantingYear && { plantingYear: parseInt(plantingYear) }),
      },
      include: {
        farmer: true,
        district: true,
      },
    });

    res.json({
      success: true,
      message: 'Farm updated successfully',
      data: farm,
    });
  } catch (error) {
    console.error('Update farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get farms by district
const getFarmsByDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;

    const farms = await prisma.farm.findMany({
      where: { districtId },
      include: {
        farmer: { select: { uuid: true, name: true, email: true } },
        district: true,
        productivities: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: farms,
      count: farms.length
    });
  } catch (error) {
    console.error('Get farms by district error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Delete farm
const deleteFarm = async (req, res) => {
  try {
    const { uuid } = req.params;

    await prisma.farm.delete({
      where: { uuid },
    });

    res.json({
      success: true,
      message: 'Farm deleted successfully',
    });
  } catch (error) {
    console.error('Delete farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  createFarm,
  getAllFarms,
  getFarmByUuid,
  getFarmsByDistrict,
  updateFarm,
  deleteFarm,
};
