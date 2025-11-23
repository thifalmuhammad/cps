const prisma = require('../lib/prisma');
const { validateUuid, validateStringLength, sanitizeString } = require('../utils/validation');

// Get pending farms for verification
const getPendingFarms = async (req, res) => {
  try {
    const farms = await prisma.farm.findMany({
      where: {
        status: 'PENDING_VERIFICATION'
      },
      include: {
        farmer: {
          select: {
            uuid: true,
            name: true,
            email: true
          }
        },
        district: {
          select: {
            uuid: true,
            districtName: true,
            districtCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: farms
    });
  } catch (error) {
    console.error('Get pending farms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Verify farm with QGIS polygon data
const verifyFarm = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { verifiedGeometry, farmArea, notes } = req.body;
    const adminUuid = req.user?.uuid; // Assuming auth middleware sets req.user

    // Validate UUID
    if (!validateUuid(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farm UUID format'
      });
    }

    // Validate required fields
    if (!verifiedGeometry) {
      return res.status(400).json({
        success: false,
        message: 'Verified geometry is required'
      });
    }

    // Validate geometry is valid GeoJSON
    try {
      const geometry = JSON.parse(verifiedGeometry);
      if (!geometry.type || !geometry.coordinates) {
        throw new Error('Invalid GeoJSON format');
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GeoJSON geometry format'
      });
    }

    // Update farm with verified data
    const updatedFarm = await prisma.farm.update({
      where: { uuid },
      data: {
        status: 'VERIFIED',
        verifiedGeometry: sanitizeString(verifiedGeometry),
        farmArea: farmArea || undefined,
        verifiedAt: new Date(),
        verifiedBy: adminUuid,
        updatedAt: new Date()
      },
      include: {
        farmer: {
          select: {
            name: true,
            email: true
          }
        },
        district: {
          select: {
            districtName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Farm verified successfully',
      data: updatedFarm
    });
  } catch (error) {
    console.error('Verify farm error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Reject farm
const rejectFarm = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { reason } = req.body;
    const adminUuid = req.user?.uuid;

    if (!validateUuid(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farm UUID format'
      });
    }

    const updatedFarm = await prisma.farm.update({
      where: { uuid },
      data: {
        status: 'REJECTED',
        verifiedAt: new Date(),
        verifiedBy: adminUuid,
        description: reason ? sanitizeString(reason) : undefined,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Farm rejected',
      data: updatedFarm
    });
  } catch (error) {
    console.error('Reject farm error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get verified farms for map display
const getVerifiedFarms = async (req, res) => {
  try {
    const farms = await prisma.farm.findMany({
      where: {
        status: 'VERIFIED',
        verifiedGeometry: {
          not: null
        }
      },
      include: {
        farmer: {
          select: {
            name: true
          }
        },
        district: {
          select: {
            districtName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: farms
    });
  } catch (error) {
    console.error('Get verified farms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

module.exports = {
  getPendingFarms,
  verifyFarm,
  rejectFarm,
  getVerifiedFarms
};