import app from './app';
import prisma from './config/db';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Successfully connected to the PostgreSQL database.');

    const server = app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(async () => {
        console.log('Express server closed.');
        await prisma.$disconnect();
        console.log('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
