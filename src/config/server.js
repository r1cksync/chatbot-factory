require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  rateLimit: {
    window: process.env.API_RATE_WINDOW_MS || 15 * 60 * 1000,
    max: process.env.API_RATE_LIMIT || 100
  }
};