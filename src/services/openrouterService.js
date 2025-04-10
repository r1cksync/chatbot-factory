const axios = require('axios');
const config = require('../config/openrouter');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

const client = axios.create({
  baseURL: config.baseUrl,
  headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
  timeout: config.timeout
});

exports.generateCompletion = async (prompt, settings) => {
  try {
    const response = await client.post('/chat/completions', {
      model: config.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: settings.temperature || 0.7,
      max_tokens: settings.maxTokens || 2048
    });
    return { text: response.data.choices[0].message.content };
  } catch (error) {
    logger.error('OpenRouter completion error:', error.response?.data || error.message);
    throw new AppError('Failed to generate completion', 500);
  }
};

exports.generateEmbedding = async (text) => {
  try {
    const response = await client.post('/embeddings', {
      model: 'openai/text-embedding-ada-002', // Free model available via OpenRouter
      input: text
    });
    return response.data.data[0].embedding;
  } catch (error) {
    logger.error('OpenRouter embedding error:', error.response?.data || error.message);
    throw new AppError('Failed to generate embedding', 500);
  }
};