const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId, // Updated to standard notation
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
    enum: ['initializing', 'ready', 'error'], // Updated to match latest logic
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