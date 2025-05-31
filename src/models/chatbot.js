const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  prompt: {
    type: String,
    required: true,
    maxlength: 10000
  },
  model: {
    type: String,
    enum: [
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-7b-instruct:free',
      'mistralai/mistral-small-3.1-24b-instruct:free',
      'deepseek/deepseek-v3-base:free',
      'nvidia/llama-3.1-nemotron-nano-8b-v1:free',
      'shisa-ai/shisa-v2-llama3.3-70b:free',
      'moonshotai/kimi-vl-a3b-thinking:free',
      'arliai/qwq-32b-arliai-rpr-v1:free',
      'agentica-org/deepcoder-14b-preview:free'
    ],
    default: 'meta-llama/llama-3.1-8b-instruct:free'
  },
  documents: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  vectorStoreId: {
    type: String,
    required: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true
  },
  apiEndpoint: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['initializing', 'ready', 'error'],
    default: 'initializing'
  },
  settings: {
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      min: 1,
      max: 4096,
      default: 2048
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

chatbotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Chatbot', chatbotSchema);