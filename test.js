const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api/v1';
let token, chatbotId, apiKey;

async function testSignup() {
  const uniqueEmail = `test${Date.now()}@example.com`; // Unique email each time
  const response = await axios.post(`${BASE_URL}/users/signup`, {
    name: 'Test',
    email: uniqueEmail,
    password: 'password123'
  });
  console.log('Signup:', response.data);
  token = response.data.token;
}

async function testCreateChatbot() {
  const response = await axios.post(`${BASE_URL}/chatbots`, {
    name: 'MyBot',
    prompt: 'You are a helpful assistant'
  }, { headers: { Authorization: `Bearer ${token}` } });
  console.log('Create Chatbot:', response.data);
  chatbotId = response.data.data.chatbot._id;
  apiKey = response.data.data.chatbot.apiKey;
}

async function testUploadDocument() {
  const form = new FormData();
  form.append('file', fs.createReadStream('E:/chatbot-factory/test.txt'));
  
  const response = await axios.post(`${BASE_URL}/chatbots/${chatbotId}/upload`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
  });
  console.log('Upload Document:', response.data);
}

async function testChat() {
  const response = await axios.post(`${BASE_URL}/chatbots/chat/${apiKey}`, {
    message: 'Hi, what’s in the document?'
  });
  console.log('Chat:', response.data);
}

async function runTests() {
  try {
    await testSignup();
    await testCreateChatbot();
    await testUploadDocument();
    await testChat();
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

runTests();