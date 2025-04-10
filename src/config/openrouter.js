require('dotenv').config();

module.exports = {
  apiKey: process.env.OPENROUTER_API_KEY,
  baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultModel: 'meta-llama/llama-3-8b-instruct', // Free model
  maxRetries: 3,
  timeout: 30000
};