const openrouterService = require('./openrouterService');
const embeddingService = require('./embeddingService');
const logger = require('../utils/logger');

const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// Beta distribution for temperature (approximated)
function sampleBeta(alpha, beta) {
  const x = Math.random();
  const y = Math.random();
  return (x * alpha) / (x * alpha + y * beta);
}

// Cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) || 0;
}

// Perturb response for MCMC (simplified: rephrase via OpenRouter)
async function perturbResponse(response, prompt, model = DEFAULT_MODEL) {
  const perturbPrompt = `Slightly rephrase this response while keeping its meaning: "${response}"`;
  const newResponse = await openrouterService.generateCompletion(perturbPrompt, {
    temperature: 0.8,
    maxTokens: 200
  }, model);
  return newResponse.text;
}

async function quantumInspiredSample(prompt, settings, mode, originalMessage, model = DEFAULT_MODEL) {
  try {
    // Precision mode: Direct completion with low temperature
    if (mode === 'precision') {
      const response = await openrouterService.generateCompletion(prompt, {
        ...settings,
        temperature: 0.7
      }, model);
      logger.info(`QIRS precision: Generated response for prompt`);
      return { text: response.text };
    }

    // Exploration mode: MCMC sampling with embeddings
    if (mode === 'exploration') {
      if (!originalMessage) {
        logger.warn('No original message provided for exploration mode; using prompt');
        originalMessage = prompt;
      }

      const promptEmbedding = await embeddingService.createEmbedding(originalMessage);
      const initialTemp = 0.5 + sampleBeta(2, 2);
      let currentResponse = await openrouterService.generateCompletion(prompt, {
        ...settings,
        temperature: initialTemp
      }, model);
      let currentText = currentResponse.text;
      let currentEmbedding = await embeddingService.createEmbedding(currentText);
      let currentScore = cosineSimilarity(promptEmbedding, currentEmbedding) + 0.3 * currentText.length / 1000;

      const candidates = [{ text: currentText, score: currentScore }];
      const maxSteps = 3;

      for (let i = 0; i < maxSteps; i++) {
        const newText = await perturbResponse(currentText, prompt, model);
        const newEmbedding = await embeddingService.createEmbedding(newText);
        const newScore = cosineSimilarity(promptEmbedding, newEmbedding) + 0.3 * newText.length / 1000;

        const acceptanceRatio = Math.min(1, newScore / currentScore);
        if (Math.random() < acceptanceRatio) {
          currentText = newText;
          currentEmbedding = newEmbedding;
          currentScore = newScore;
        }

        candidates.push({ text: currentText, score: currentScore });
      }

      const bestCandidate = candidates.reduce((best, curr) =>
        curr.score > best.score ? curr : best
      );
      logger.info(`QIRS exploration: Selected response with score ${bestCandidate.score}`);
      return { text: bestCandidate.text };
    }

    // Default mode: Balanced completion with moderate temperature
    const response = await openrouterService.generateCompletion(prompt, {
      ...settings,
      temperature: 0.9
    }, model);
    logger.info(`QIRS default: Generated balanced response for prompt`);
    return { text: response.text };
  } catch (error) {
    logger.error(`QIRS failed: ${error.message}`);
    throw error;
  }
}

module.exports = { quantumInspiredSample };