const Chatbot = require('../models/chatbot'); // Corrected from '../models/chatbotModel'
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const embeddingService = require('../services/embeddingService');
const pdfParse = require('pdf-parse');
const keyGenerator = require('../utils/keyGenerator');
const logger = require('../utils/logger');
const openrouterService = require('../services/openrouterService');

exports.createChatbot = catchAsync(async (req, res, next) => {
  const { name, prompt } = req.body;
  if (!name || !prompt) return next(new AppError('Name and prompt are required', 400));

  const apiKey = await keyGenerator.generateApiKey();
  const apiEndpoint = `/api/v1/chatbots/chat/${apiKey}`;
  const vectorStoreId = `${req.user._id}-${Date.now()}`;

  await embeddingService.createVectorStore(vectorStoreId);

  const chatbot = await Chatbot.create({
    owner: req.user._id,
    name,
    prompt,
    vectorStoreId,
    apiKey,
    apiEndpoint,
    status: 'initializing'
  });

  const fullPrompt = `${prompt}`;
  const response = await openrouterService.generateCompletion(fullPrompt, {
    temperature: 0.7,
    maxTokens: 2048
  });

  res.status(201).json({
    status: 'success',
    data: {
      chatbot: {
        _id: chatbot._id,
        name: chatbot.name,
        prompt: chatbot.prompt,
        apiKey: chatbot.apiKey,
        apiEndpoint: chatbot.apiEndpoint
      },
      response: response.text
    }
  });
});

exports.uploadDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!req.file) return next(new AppError('No file uploaded', 400));

  const chatbot = await Chatbot.findById(id);
  if (!chatbot) return next(new AppError('Chatbot not found', 404));
  if (chatbot.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not own this chatbot', 403));
  }

  let content;
  if (req.file.mimetype === 'application/pdf') {
    const pdfData = await pdfParse(req.file.buffer);
    content = pdfData.text;
  } else if (req.file.mimetype === 'text/plain') {
    content = req.file.buffer.toString('utf8');
  } else {
    throw new AppError('Unsupported file type. Use PDF or TXT', 400);
  }

  const document = {
    name: req.file.originalname,
    type: req.file.mimetype === 'application/pdf' ? 'pdf' : 'txt',
    content: content
  };

  await embeddingService.createEmbeddings(content, chatbot.vectorStoreId);

  chatbot.documents.push(document);
  chatbot.status = 'ready';
  await chatbot.save();

  res.status(200).json({
    status: 'success',
    data: { document: { name: document.name, type: document.type } },
    message: 'Document processed'
  });
});

exports.handleChatRequest = catchAsync(async (req, res, next) => {
  const { apiKey } = req.params;
  const { message } = req.body;
  if (!message) return next(new AppError('Message is required', 400));

  const chatbot = await Chatbot.findOne({ apiKey });
  if (!chatbot) return next(new AppError('Invalid chatbot API key', 401));
  if (chatbot.status !== 'ready') {
    return next(new AppError('Chatbot is not ready', 503));
  }

  const context = await embeddingService.searchVectorStore(message, chatbot.vectorStoreId);
  const fullPrompt = `${chatbot.prompt}\n\nContext:\n${context}\n\nUser: ${message}`;
  const response = await openrouterService.generateCompletion(fullPrompt, chatbot.settings);

  res.status(200).json({ status: 'success', data: { response: response.text } });
});