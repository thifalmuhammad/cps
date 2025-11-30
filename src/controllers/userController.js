const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { v4: uuidv4 } = require('uuid');
const { validateUuid, validateEmail, validatePassword, validateStringLength, sanitizeString, sanitizeEmail } = require('../utils/validation');

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

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    if (!validateStringLength(name, 2)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long',
      });
    }

    // Sanitize input
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeString(name);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        uuid: uuidv4(),
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        isAdmin: Boolean(isAdmin),
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
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
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
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get user by UUID
const getUserByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Validate UUID format
    if (!validateUuid(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UUID format',
      });
    }

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
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log login attempt (without password)
    console.log(`[LOGIN] Attempt for email: ${email}`);

    // Validation
    if (!email || !password) {
      console.log(`[LOGIN] Missing credentials`);
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user) {
      console.log(`[LOGIN] User not found: ${sanitizedEmail}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[LOGIN] Invalid password for user: ${sanitizedEmail}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    console.log(`[LOGIN] Success for user: ${user.name} (${user.email})`);
    
    // Return user data (without password)
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

module.exports = {
  registerUser,
  getAllUsers,
  getUserByUuid,
  loginUser,
};
