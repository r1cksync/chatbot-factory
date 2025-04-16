const { pipeline } = require('@xenova/transformers');
const logger = require('../utils/logger');
const AppError = require('../utils/appError');

const stores = new Map(); // In-memory stores
let embedder;

(async () => {
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  logger.info('Embedding model loaded');
})();

exports.createVectorStore = async (vectorStoreId) => {
  stores.set(vectorStoreId, { texts: [], embeddings: [] });
};

exports.createEmbeddings = async (text, vectorStoreId) => {
  const store = stores.get(vectorStoreId);
  if (!store) throw new AppError('Vector store not found', 404);
  if (!embedder) throw new AppError('Embedding model not yet loaded', 503);

  const chunks = chunkText(text, 500);
  for (const chunk of chunks) {
    const embedding = await embedder(chunk, { pooling: 'mean', normalize: true });
    const embeddingArray = new Float32Array(embedding.data);
    logger.info(`Embedding length: ${embeddingArray.length}, Sample: ${embeddingArray.slice(0, 5)}`);
    if (embeddingArray.length !== 384) {
      throw new AppError(`Embedding dimension mismatch: expected 384, got ${embeddingArray.length}`, 500);
    }
    store.embeddings.push(embeddingArray);
    store.texts.push(chunk);
  }
};

exports.createEmbedding = async (text) => {
  if (!embedder) throw new AppError('Embedding model not yet loaded', 503);
  if (!text || typeof text !== 'string') throw new AppError('Invalid text input', 400);

  const embedding = await embedder(text, { pooling: 'mean', normalize: true });
  const embeddingArray = new Float32Array(embedding.data);
  logger.info(`Single embedding length: ${embeddingArray.length}, Sample: ${embeddingArray.slice(0, 5)}`);
  if (embeddingArray.length !== 384) {
    throw new AppError(`Single embedding dimension mismatch: expected 384, got ${embeddingArray.length}`, 500);
  }
  return embeddingArray;
};

exports.searchVectorStore = async (query, vectorStoreId, limit = 5) => {
  const store = stores.get(vectorStoreId);
  if (!store) throw new AppError('Vector store not found', 404);
  if (!embedder) throw new AppError('Embedding model not yet loaded', 503);

  const queryEmbedding = await embedder(query, { pooling: 'mean', normalize: true });
  const queryArray = new Float32Array(queryEmbedding.data);
  logger.info(`Query embedding length: ${queryArray.length}`);

  if (queryArray.length !== 384) {
    throw new AppError(`Query embedding dimension mismatch: expected 384, got ${queryArray.length}`, 500);
  }

  const similarities = store.embeddings.map((emb, i) => ({
    index: i,
    similarity: cosineSimilarity(queryArray, emb)
  }));
  similarities.sort((a, b) => b.similarity - a.similarity);
  return similarities.slice(0, limit).map(s => store.texts[s.index]).join('\n\n');
};

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function chunkText(text, maxTokens) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const tokenCount = paragraph.length / 4; // Rough estimate
    if ((currentChunk.length / 4) + tokenCount > maxTokens) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}