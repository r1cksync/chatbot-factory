const openrouterService = require('./openrouterService');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

exports.generateResponse = async (message, context, systemPrompt, settings) => {
  try {
    const fullPrompt = `${systemPrompt}\n\nContext:\n${context}\n\nUser: ${message}`;
    return await openrouterService.generateCompletion(fullPrompt, settings);
  } catch (error) {
    logger.error('Error generating response:', error);
    throw new AppError('Failed to generate response', 500);
  }
};