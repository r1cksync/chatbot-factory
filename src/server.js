const app = require('./app');
const config = require('./config/server');
const logger = require('./utils/logger');
const mongoose = require('mongoose');
const dbConfig = require('./config/database');

mongoose.connect(dbConfig.uri, dbConfig.options)
  .then(() => {
    logger.info('Connected to MongoDB');
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });

    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', err);
      server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(() => logger.info('Process terminated!'));
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });