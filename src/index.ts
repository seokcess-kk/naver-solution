import 'reflect-metadata';
import 'tsconfig-paths/register';
import * as dotenv from 'dotenv';
import { AppDataSource } from '@infrastructure/database/data-source';
import { createApp } from '@presentation/api/app';
import { DIContainer } from '@presentation/api/config/DIContainer';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Initialize database and start server
 */
async function bootstrap(): Promise<void> {
  try {
    // Initialize database connection
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✓ Database connected successfully');

    // Initialize DI container
    console.log('Initializing dependency injection container...');
    const container = DIContainer.getInstance(AppDataSource);
    console.log('✓ DI container initialized');

    // Create Express application
    const app = createApp(container);

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('✓ HTTP server closed');

        try {
          await AppDataSource.destroy();
          console.log('✓ Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during database shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start application
bootstrap();
