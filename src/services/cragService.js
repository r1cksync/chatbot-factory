const openrouterService = require('./openrouterService');
const logger = require('../utils/logger');

async function evaluateRelevance(question, documents) {
  try {
    const prompt = `Is the following document relevant to the question "${question}"? Answer "yes" or "no".\n\nDocument: ${documents.join('\n')}`;
    const response = await openrouterService.generateCompletion(prompt, {
      temperature: 0.2,
      maxTokens: 10
    });
    return response.text.trim().toLowerCase() === 'yes';
  } catch (error) {
    logger.error(`Relevance evaluation failed: ${error.message}`);
    return false; // Default to false to trigger correction
  }
}

async function correctiveRAG(question, vectorStoreId, embeddingService) {
  try {
    // Initial retrieval
    let documents = await embeddingService.searchVectorStore(question, vectorStoreId);
    const isRelevant = await evaluateRelevance(question, documents);

    if (isRelevant) {
      return documents.join('\n');
    }

    // Corrective step: rewrite query
    logger.info(`Irrelevant documents for question: ${question}. Rewriting query.`);
    const rewritePrompt = `Rephrase the question "${question}" to make it clearer for retrieving relevant documents.`;
    const rewrittenResponse = await openrouterService.generateCompletion(rewritePrompt, {
      temperature: 0.5,
      maxTokens: 50
    });
    const rewrittenQuestion = rewrittenResponse.text.trim();

    // Retry retrieval with rewritten query
    documents = await embeddingService.searchVectorStore(rewrittenQuestion, vectorStoreId);
    return documents.join('\n');
  } catch (error) {
    logger.error(`CRAG failed: ${error.message}`);
    return ''; // Fallback to empty context
  }
}

module.exports = { correctiveRAG };