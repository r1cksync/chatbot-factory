const keyGenerator = require('../utils/keyGenerator');

exports.createChatbotApi = async (chatbotId, apiKey) => {
  return {
    apiKey,
    apiEndpoint: `/api/v1/chatbots/chat/${apiKey}`
  };
};