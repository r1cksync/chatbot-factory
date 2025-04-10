const pdfParse = require('pdf-parse');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.processDocument = async (file) => {
  try {
    const fileName = file.originalname;
    const fileType = file.originalname.split('.').pop().toLowerCase();
    const content = file.buffer.toString('base64'); // Store as base64 in DB
    return { fileName, fileType, content };
  } catch (error) {
    logger.error('Error processing document:', error);
    throw new AppError('Failed to process document', 500);
  }
};

exports.extractText = async (content) => {
  try {
    const buffer = Buffer.from(content, 'base64');
    const fileType = buffer.toString('utf8').startsWith('%PDF') ? 'pdf' : 'txt';
    
    if (fileType === 'pdf') {
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    }
    return buffer.toString('utf8');
  } catch (error) {
    logger.error('Error extracting text:', error);
    throw new AppError('Failed to extract text', 500);
  }
};