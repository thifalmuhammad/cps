const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');

// Register User (Admin)
const registerUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        uuid: uuidv4(),
        name,
        email,
        password: hashedPassword,
        isAdmin: isAdmin || false,
        createdAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        uuid: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get user by UUID
const getUserByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;

    const user = await prisma.user.findUnique({
      where: { uuid },
      select: {
        uuid: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  getAllUsers,
  getUserByUuid,
};
