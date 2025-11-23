const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');
const { validateUuid, validateStringLength, sanitizeString } = require('../utils/validation');

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

    // Validate input length and format
    if (!validateStringLength(districtCode, 2) || !validateStringLength(districtName, 2)) {
      return res.status(400).json({
        success: false,
        message: 'District code and name must be at least 2 characters long',
      });
    }

    // Sanitize input
    const sanitizedCode = sanitizeString(districtCode).toUpperCase();
    const sanitizedName = sanitizeString(districtName);

    const district = await prisma.district.create({
      data: {
        uuid: uuidv4(),
        districtCode: sanitizedCode,
        districtName: sanitizedName,
      },
    });

    res.status(201).json({
      success: true,
      message: 'District created successfully',
      data: district,
    });
  } catch (error) {
    console.error('Create district error:', error);
    
    // Handle Prisma specific errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'District code already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
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
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get district by UUID
const getDistrictByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Validate UUID format
    if (!validateUuid(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UUID format',
      });
    }
    
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
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'District not found',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Update district
const updateDistrict = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { districtCode, districtName } = req.body;

    // Validate UUID format
    if (!validateUuid(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UUID format',
      });
    }

    // Validate at least one field is provided
    if (!districtCode && !districtName) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (districtCode or districtName) is required',
      });
    }

    // Prepare update data with sanitization
    const updateData = {};
    if (districtCode) {
      if (!validateStringLength(districtCode, 2)) {
        return res.status(400).json({
          success: false,
          message: 'District code must be at least 2 characters long',
        });
      }
      updateData.districtCode = sanitizeString(districtCode).toUpperCase();
    }
    if (districtName) {
      if (!validateStringLength(districtName, 2)) {
        return res.status(400).json({
          success: false,
          message: 'District name must be at least 2 characters long',
        });
      }
      updateData.districtName = sanitizeString(districtName);
    }

    const district = await prisma.district.update({
      where: { uuid },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'District updated successfully',
      data: district,
    });
  } catch (error) {
    console.error('Update district error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'District not found',
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'District code already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Delete district
const deleteDistrict = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Validate UUID format
    if (!validateUuid(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UUID format',
      });
    }

    await prisma.district.delete({
      where: { uuid },
    });

    res.json({
      success: true,
      message: 'District deleted successfully',
    });
  } catch (error) {
    console.error('Delete district error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'District not found',
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete district. It is referenced by other records.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
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
