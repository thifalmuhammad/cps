const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');

// Create District
const createDistrict = async (req, res) => {
  try {
    const { districtCode, districtName } = req.body;

    if (!districtCode || !districtName) {
      return res.status(400).json({
        success: false,
        message: 'District code and name are required',
      });
    }

    const district = await prisma.district.create({
      data: {
        uuid: uuidv4(),
        districtCode,
        districtName,
      },
    });

    res.status(201).json({
      success: true,
      message: 'District created successfully',
      data: district,
    });
  } catch (error) {
    console.error('Create district error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get all districts
const getAllDistricts = async (req, res) => {
  try {
    const districts = await prisma.district.findMany();
    res.json({
      success: true,
      data: districts,
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get district by UUID
const getDistrictByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    const district = await prisma.district.findUnique({
      where: { uuid },
    });

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found',
      });
    }

    res.json({
      success: true,
      data: district,
    });
  } catch (error) {
    console.error('Get district error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update district
const updateDistrict = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { districtCode, districtName } = req.body;

    const district = await prisma.district.update({
      where: { uuid },
      data: {
        ...(districtCode && { districtCode }),
        ...(districtName && { districtName }),
      },
    });

    res.json({
      success: true,
      message: 'District updated successfully',
      data: district,
    });
  } catch (error) {
    console.error('Update district error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Delete district
const deleteDistrict = async (req, res) => {
  try {
    const { uuid } = req.params;

    await prisma.district.delete({
      where: { uuid },
    });

    res.json({
      success: true,
      message: 'District deleted successfully',
    });
  } catch (error) {
    console.error('Delete district error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  createDistrict,
  getAllDistricts,
  getDistrictByUuid,
  updateDistrict,
  deleteDistrict,
};
