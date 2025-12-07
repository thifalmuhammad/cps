const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Graceful shutdown
const gracefulDisconnect = async () => {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error); //error handling
  }
};

process.on('SIGTERM', gracefulDisconnect);
process.on('SIGINT', gracefulDisconnect);

module.exports = prisma;