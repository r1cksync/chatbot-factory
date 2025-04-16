const express = require('express');
const chatbotController = require('../controllers/chatbotController');
const authController = require('../controllers/authController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/', authController.protect, chatbotController.createChatbot);
router.post('/:id/upload', authController.protect, upload.single('file'), chatbotController.uploadDocument);
router.post('/chat/:apiKey', chatbotController.handleChatRequest);
router.post('/:apiKey/sample', chatbotController.sampleResponse);

module.exports = router;