const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
let token, chatbotId, apiKey;

axios.defaults.timeout = 60000;

async function testSignup() {
  const uniqueEmail = `test${Date.now()}@example.com`;
  const response = await axios.post(`${BASE_URL}/api/v1/users/signup`, {
    name: 'Test',
    email: uniqueEmail,
    password: 'password123'
  });
  console.log('Signup:', JSON.stringify(response.data, null, 2));
  token = response.data.token;
}

async function testCreateChatbot() {
  const response = await axios.post(`${BASE_URL}/api/v1/chatbots`, {
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
  
  const response = await axios.post(`${BASE_URL}/api/v1/chatbots/${chatbotId}/upload`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    timeout: 180000
  });
  console.log('Upload Document:', JSON.stringify(response.data, null, 2));
}

async function testChat() {
  const message = 'Can you use the theorem to explain what’s in the document?';
  // Test 1: Chat endpoint with default mode (no mode)
  const response1 = await axios.post(`${BASE_URL}/api/v1/chatbots/chat/${apiKey}`, {
    message
  });
  console.log('Chat (Default):', JSON.stringify(response1.data, null, 2));
  const sampleEndpoint = response1.data.data.sampleEndpoint
    ? `${BASE_URL}${response1.data.data.sampleEndpoint}`
    : `${BASE_URL}/api/v1/chatbots/${apiKey}/sample`;

  // Test 2: Chat endpoint with precision mode
  const response2 = await axios.post(`${BASE_URL}/api/v1/chatbots/chat/${apiKey}`, {
    message,
    mode: 'precision'
  });
  console.log('Chat (Precision):', JSON.stringify(response2.data, null, 2));

  // Test 3: Chat endpoint with exploration mode
  const response3 = await axios.post(`${BASE_URL}/api/v1/chatbots/chat/${apiKey}`, {
    message,
    mode: 'exploration'
  });
  console.log('Chat (Exploration):', JSON.stringify(response3.data, null, 2));

  // Test 4: Sample endpoint with default mode (no mode)
  const response4 = await axios.post(sampleEndpoint, {
    message
  });
  console.log('Sample (Default):', JSON.stringify(response4.data, null, 2));

  // Test 5: Sample endpoint with precision mode
  const response5 = await axios.post(sampleEndpoint, {
    message,
    mode: 'precision'
  });
  console.log('Sample (Precision):', JSON.stringify(response5.data, null, 2));

  // Test 6: Sample endpoint with exploration mode
  const response6 = await axios.post(sampleEndpoint, {
    message,
    mode: 'exploration'
  });
  console.log('Sample (Exploration):', JSON.stringify(response6.data, null, 2));
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