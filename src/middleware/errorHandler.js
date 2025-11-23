// Error handling middleware

const handlePrismaError = (error) => {
  switch (error.code) {
    case 'P2002':
      return {
        status: 409,
        message: 'Duplicate entry. This record already exists.',
      };
    case 'P2025':
      return {
        status: 404,
        message: 'Record not found.',
      };
    case 'P2003':
      return {
        status: 409,
        message: 'Cannot delete record. It is referenced by other records.',
      };
    case 'P2014':
      return {
        status: 400,
        message: 'Invalid ID provided.',
      };
    default:
      return {
        status: 500,
        message: 'Database error occurred.',
      };
  }
};

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    const { status, message } = handlePrismaError(err);
    return res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: err.details || err.message,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
  handlePrismaError,
};