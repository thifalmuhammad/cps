require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// TODO: Add CSRF protection for production
// const csrf = require('csurf');
// app.use(csrf({ cookie: true }));

// Request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  try {
    const requestLogger = require('./src/middleware/logger');
    app.use(requestLogger);
  } catch (err) {
    console.warn('Logger middleware not found, skipping request logging');
  }
}

// API routes
app.use('/api', require('./src/routes'));

// Serve React build
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// Import error handling middleware
let errorHandler, notFound;
try {
  ({ errorHandler, notFound } = require('./src/middleware/errorHandler'));
} catch (err) {
  console.warn('Error handler middleware not found, using default error handling');
  errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  };
  notFound = (req, res, next) => {
    res.status(404).json({ success: false, message: 'Not found' });
  };
}

// Fallback untuk React SPA - handle all non-API routes
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Only handle GET requests for SPA
  if (req.method !== 'GET') {
    return next();
  }
  
  // Serve React app
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'), (err) => {
    if (err && !res.headersSent) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ success: false, message: 'Unable to serve application' });
    }
  });
});

// 404 handler for API routes
app.use('/api/*', notFound);

// Global error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  
  // Set timeout for forced shutdown
  const timeout = setTimeout(() => {
    console.log('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000); // 10 seconds
  
  server.close(() => {
    clearTimeout(timeout);
    console.log('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));