const openrouterService = require('./openrouterService');
const logger = require('../utils/logger');

async function evaluateRelevance(question, documents) {
  try {
    // Normalize documents to a single string
    let documentText;
    if (Array.isArray(documents)) {
      documentText = documents.join('\n');
    } else if (typeof documents === 'string') {
      documentText = documents;
    } else if (documents && typeof documents === 'object') {
      documentText = JSON.stringify(documents); // Handle objects
    } else {
      logger.warn(`Invalid documents format for question: ${question}`);
      return false;
    }

    const prompt = `Is the following document relevant to the question "${question}"? Answer "yes" or "no".\n\nDocument: ${documentText}`;
    const response = await openrouterService.generateCompletion(prompt, {
      temperature: 0.2,
      maxTokens: 10
    });
    const isRelevant = response.text.trim().toLowerCase() === 'yes';
    logger.info(`Relevance check for "${question}": ${isRelevant ? 'Relevant' : 'Not relevant'}`);
    return isRelevant;
  } catch (error) {
    logger.error(`Relevance evaluation failed: ${error.message}`);
    return false; // Default to false to trigger correction
  }
}

async function correctiveRAG(question, vectorStoreId, embeddingService) {
  try {
    // Initial retrieval
    const initialDocuments = await embeddingService.searchVectorStore(question, vectorStoreId);
    logger.info(`Initial documents for "${question}": ${JSON.stringify(initialDocuments)}`);
    const isRelevant = await evaluateRelevance(question, initialDocuments);

    if (isRelevant) {
      return Array.isArray(initialDocuments) ? initialDocuments.join('\n') : String(initialDocuments);
    }

    // Corrective step: rewrite query
    logger.info(`Irrelevant documents for question: ${question}. Rewriting query.`);
    const rewritePrompt = `Rephrase the question "${question}" to make it clearer for retrieving relevant documents.`;
    const rewrittenResponse = await openrouterService.generateCompletion(rewritePrompt, {
      temperature: 0.5,
      maxTokens: 50
    });
    const rewrittenQuestion = rewrittenResponse.text.trim();
    logger.info(`Rewritten question: ${rewrittenQuestion}`);

    // Retry retrieval with rewritten query
    const newDocuments = await embeddingService.searchVectorStore(rewrittenQuestion, vectorStoreId);
    logger.info(`Rewritten documents for "${rewrittenQuestion}": ${JSON.stringify(newDocuments)}`);
    return Array.isArray(newDocuments) ? newDocuments.join('\n') : String(newDocuments);
  } catch (error) {
    logger.error(`CRAG failed: ${error.message}`);
    return ''; // Fallback to empty context
  }
}

module.exports = { correctiveRAG };