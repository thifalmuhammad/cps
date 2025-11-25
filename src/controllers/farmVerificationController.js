const prisma = require('../lib/prisma');
const { validateUuid, validateStringLength, sanitizeString } = require('../utils/validation');

// Bulk verify farms from FeatureCollection
// Matches features to farms by farmer name, then saves geometry per farm
const bulkVerifyFarms = async (req, res) => {
  try {
    const { featureCollection } = req.body;
    const adminUuid = req.user?.uuid || null;

    console.log(`\n📦 [bulkVerifyFarms] Received bulk verification request`);
    console.log(`👤 Admin UUID: ${adminUuid || '(not authenticated)'}`);

    // Validate input
    if (!featureCollection) {
      return res.status(400).json({
        success: false,
        message: 'featureCollection is required'
      });
    }

    let geojson;
    try {
      geojson = typeof featureCollection === 'string'
        ? JSON.parse(featureCollection)
        : featureCollection;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GeoJSON format: ' + e.message
      });
    }

    // Extract features array
    let features = [];
    if (geojson.type === 'FeatureCollection') {
      features = geojson.features || [];
    } else if (geojson.type === 'Feature') {
      features = [geojson];
    }

    if (features.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No features found in GeoJSON'
      });
    }

    console.log(`📊 Found ${features.length} features to process`);

    // Process each feature
    const results = {
      success: [],
      failed: []
    };

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const farmerName = feature.properties?.Pemilik;
      const geometry = feature.geometry;

      console.log(`\n🔄 Processing feature ${i + 1}/${features.length}: "${farmerName}"`);

      try {
        // Validate feature
        if (!farmerName) {
          throw new Error('Feature missing "Pemilik" property (farmer name)');
        }

        if (!geometry) {
          throw new Error('Feature missing geometry');
        }

        // Find farmer by name
        console.log(`  🔍 Looking up farmer: "${farmerName}"`);
        const farmer = await prisma.user.findFirst({
          where: {
            name: {
              mode: 'insensitive', // Case-insensitive search
              equals: farmerName.trim()
            }
          }
        });

        if (!farmer) {
          throw new Error(`Farmer not found: "${farmerName}"`);
        }

        console.log(`  ✅ Found farmer: ${farmer.uuid}`);

        // Find pending farm for this farmer
        console.log(`  🔍 Looking up pending farm for farmer ${farmer.uuid}`);
        const farms = await prisma.farm.findMany({
          where: {
            farmerId: farmer.uuid,
            status: 'PENDING_VERIFICATION'
          }
        });

        if (farms.length === 0) {
          throw new Error(`No pending farms found for farmer "${farmerName}"`);
        }

        // Use first pending farm (or could implement logic to match by area/district)
        const farm = farms[0];
        console.log(`  ✅ Found pending farm: ${farm.uuid}`);

        // Save geometry to this farm
        console.log(`  💾 Saving geometry to farm...`);
        const featureToSave = {
          type: 'Feature',
          properties: feature.properties,
          geometry: geometry
        };

        const updatedFarm = await prisma.farm.update({
          where: { uuid: farm.uuid },
          data: {
            status: 'VERIFIED',
            verifiedGeometry: JSON.stringify(featureToSave),
            verifiedAt: new Date(),
            verifiedBy: adminUuid,
            updatedAt: new Date()
          },
          include: {
            farmer: {
              select: { uuid: true, name: true, email: true }
            },
            district: {
              select: { uuid: true, districtName: true }
            }
          }
        });

        console.log(`  ✅ Farm verified successfully`);

        results.success.push({
          farmerName,
          farmId: farm.uuid,
          farmerId: farmer.uuid,
          status: 'VERIFIED'
        });

      } catch (error) {
        console.error(`  ❌ Error processing feature ${i + 1}:`, error.message);
        results.failed.push({
          farmerName: farmerName || 'Unknown',
          error: error.message
        });
      }
    }

    console.log(`\n📊 Bulk verification complete:`);
    console.log(`   ✅ Success: ${results.success.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}\n`);

    res.json({
      success: true,
      message: 'Bulk farm verification completed',
      results: {
        total: features.length,
        successCount: results.success.length,
        failureCount: results.failed.length,
        successful: results.success,
        failed: results.failed
      }
    });

  } catch (error) {
    console.error('❌ Bulk verify error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get pending farms for verification
const getPendingFarms = async (req, res) => {
  try {
    console.log('\n📋 [getPendingFarms] Fetching ALL farms (no filter)...');

    // Get ALL farms first - no status filter
    const farms = await prisma.farm.findMany({
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
        },
        productivities: {
          select: {
            uuid: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${farms.length} total farms`);

    // Filter by status in JavaScript (workaround for enum issue)
    const pendingFarms = farms.filter(f => f.status === 'PENDING_VERIFICATION');

    console.log(`✅ Found ${pendingFarms.length} pending farms\n`);

    res.json({
      success: true,
      message: 'Pending farms retrieved successfully',
      count: pendingFarms.length,
      data: pendingFarms
    });
  } catch (error) {
    console.error('❌ [getPendingFarms] Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message,
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};// Verify farm with QGIS polygon data
const verifyFarm = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { verifiedGeometry, farmArea, notes } = req.body;
    // Get admin UUID from auth middleware if available, otherwise null
    const adminUuid = req.user?.uuid || null;

    console.log(`\n🔍 [verifyFarm] Received request for farm: ${uuid}`);
    console.log(`📊 Geometry type: ${typeof verifiedGeometry}`);
    console.log(`📊 Geometry length: ${verifiedGeometry?.length || 0}`);
    console.log(`👤 Admin UUID: ${adminUuid || '(not authenticated)'}`);

    // Validate UUID
    if (!validateUuid(uuid)) {
      console.error(`❌ Invalid UUID format: ${uuid}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid farm UUID format'
      });
    }

    // Validate required fields
    if (!verifiedGeometry) {
      console.error('❌ No geometry provided');
      return res.status(400).json({
        success: false,
        message: 'Verified geometry is required'
      });
    }

    // Validate geometry is valid GeoJSON
    let geometry;
    try {
      geometry = JSON.parse(verifiedGeometry);
      console.log(`✅ Geometry parsed. Type: ${geometry.type}`);

      // Handle FeatureCollection (extract first feature's geometry)
      if (geometry.type === 'FeatureCollection') {
        if (!Array.isArray(geometry.features) || geometry.features.length === 0) {
          throw new Error('FeatureCollection must have at least one feature');
        }
        const firstGeometry = geometry.features[0].geometry;
        if (!firstGeometry) {
          throw new Error('Feature must have geometry');
        }
        geometry = firstGeometry;
        console.log(`✅ Extracted geometry from FeatureCollection. Type: ${geometry.type}`);
      }

      // Handle Feature (extract geometry)
      if (geometry.type === 'Feature') {
        geometry = geometry.geometry;
        console.log(`✅ Extracted geometry from Feature. Type: ${geometry.type}`);
      }

      // Now validate the actual geometry (Polygon, MultiPolygon, etc)
      if (!geometry.type || !geometry.coordinates) {
        throw new Error('Geometry must have type and coordinates properties');
      }

      console.log(`✅ Geometry validation passed. Storing original FeatureCollection.`);
    } catch (e) {
      console.error(`❌ GeoJSON parse error: ${e.message}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid GeoJSON geometry format: ' + e.message
      });
    }    // Check if farm exists and get current data
    const existingFarm = await prisma.farm.findUnique({
      where: { uuid }
    });

    if (!existingFarm) {
      console.error(`❌ Farm not found: ${uuid}`);
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    console.log(`✅ Farm found. Current status: ${existingFarm.status}`);

    // Update farm with verified data
    const updatedFarm = await prisma.farm.update({
      where: { uuid },
      data: {
        status: 'VERIFIED',
        verifiedGeometry: sanitizeString(verifiedGeometry),
        farmArea: farmArea ? parseFloat(farmArea) : existingFarm.farmArea,
        verifiedAt: new Date(),
        verifiedBy: adminUuid,
        updatedAt: new Date()
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
      }
    });

    console.log(`✅ Farm ${uuid} verified${adminUuid ? ` by ${adminUuid}` : ''}\n`);

    res.json({
      success: true,
      message: 'Farm verified successfully',
      data: updatedFarm
    });
  } catch (error) {
    console.error('❌ Verify farm error:', error.message);
    console.error('   Stack:', error.stack);

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
    const adminUuid = req.user?.uuid || 'system-admin';

    if (!validateUuid(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farm UUID format'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Check if farm exists
    const existingFarm = await prisma.farm.findUnique({
      where: { uuid }
    });

    if (!existingFarm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const updatedFarm = await prisma.farm.update({
      where: { uuid },
      data: {
        status: 'NEEDS_UPDATE',
        verifiedAt: new Date(),
        verifiedBy: adminUuid,
        updatedAt: new Date()
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
            districtName: true
          }
        }
      }
    });

    console.log(`Farm ${uuid} rejected by ${adminUuid}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Farm rejected successfully',
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
    console.log('\n📍 [getVerifiedFarms] Fetching verified farms...');

    // Fetch ALL farms first (no WHERE filter)
    const allFarms = await prisma.farm.findMany({
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
      }
    });

    console.log(`✅ Fetched ${allFarms.length} total farms`);

    // Filter by status in JavaScript (workaround for enum issue)
    const verifiedFarms = allFarms.filter(
      farm => farm.status === 'VERIFIED' && farm.verifiedGeometry
    );

    console.log(`✅ Found ${verifiedFarms.length} verified farms with geometry\n`);

    // Debug: log first farm geometry if any
    if (verifiedFarms.length > 0) {
      console.log(`🔍 First farm geometry sample:`);
      try {
        const geom = JSON.parse(verifiedFarms[0].verifiedGeometry);
        console.log(`   Type: ${geom.type}`);
        console.log(`   Has features: ${geom.features ? 'yes' : 'no'}`);
      } catch (e) {
        console.log(`   Error parsing: ${e.message}`);
      }
    }

    res.json({
      success: true,
      message: `Found ${verifiedFarms.length} verified farms`,
      count: verifiedFarms.length,
      data: verifiedFarms
    });
  } catch (error) {
    console.error('❌ Get verified farms error:', error);
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