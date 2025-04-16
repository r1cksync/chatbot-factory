const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://my-chatbot-factory.onrender.com/api/v1'; // Deployed version
let token, chatbotId, apiKey;

axios.defaults.timeout = 60000; // 60 seconds global timeout

async function testSignup() {
  const uniqueEmail = `test${Date.now()}@example.com`;
  const response = await axios.post(`${BASE_URL}/users/signup`, {
    name: 'Test',
    email: uniqueEmail,
    password: 'password123'
  });
  console.log('Signup:', JSON.stringify(response.data, null, 2));
  token = response.data.token;
}

async function testCreateChatbot() {
  const response = await axios.post(`${BASE_URL}/chatbots`, {
    name: 'MyBot',
    prompt: 'You are a helpful assistant skilled in math and science. Explain the Pythagorean theorem briefly and then tell me what 3 squared plus 4 squared equals.'
  }, { headers: { Authorization: `Bearer ${token}` } });
  console.log('Create Chatbot:', JSON.stringify(response.data, null, 2));
  chatbotId = response.data.data.chatbot._id;
  apiKey = response.data.data.chatbot.apiKey;
}

async function testUploadDocument() {
  const form = new FormData();
  form.append('file', fs.createReadStream('E:/chatbot-factory/small-test.txt'));
  
  const response = await axios.post(`${BASE_URL}/chatbots/${chatbotId}/upload`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    timeout: 180000 // 3 minutes for upload
  });
  console.log('Upload Document:', JSON.stringify(response.data, null, 2));
}

async function testChat() {
  // Test 1: Specific query
  const response1 = await axios.post(`${BASE_URL}/chatbots/chat/${apiKey}`, {
    message: 'Can you use the theorem to explain what’s in the document?'
  });
  console.log('Chat (Specific):', JSON.stringify(response1.data, null, 2));

  // Test 2: Vague query to trigger CRAG
  const response2 = await axios.post(`${BASE_URL}/chatbots/chat/${apiKey}`, {
    message: 'Triangle stuff'
  });
  console.log('Chat (Vague):', JSON.stringify(response2.data, null, 2));
}

async function runTests() {
  try {
    await testSignup();
    if (!token) throw new Error('Signup failed: No token received');
    await testCreateChatbot();
    if (!chatbotId || !apiKey) throw new Error('Chatbot creation failed: Missing ID or API key');
    await testUploadDocument();
    await testChat();
  } catch (error) {
    console.error('Error:', JSON.stringify(error.response ? error.response.data : { message: error.message, code: error.code }, null, 2));
  }
}

runTests();