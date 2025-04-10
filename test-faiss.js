const Faiss = require('faiss-node');

const index = new Faiss.IndexFlatL2(384);
const vector = new Float32Array(384).fill(1.0); // Dummy 384-dim vector

console.log('Adding vector...');
index.add(vector); // Single vector as Float32Array
console.log('Vector added successfully');

const query = new Float32Array(384).fill(1.0);
const { distances, indices } = index.search(query, 1);
console.log('Search result:', { distances, indices });