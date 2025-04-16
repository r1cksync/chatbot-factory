import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_ENDPOINT = 'https://my-chatbot-factory.onrender.com/api/v1/chatbots/chat/chbt_14d4ddb821f940678ffde35c3a43f122';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatRef = useRef(null);

  // Auto-scroll to bottom when chat history updates
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to history
    const newUserMessage = { role: 'user', content: message };
    setChatHistory([...chatHistory, newUserMessage]);
    setMessage('');

    try {
      // Send message and full chat history to API
      const response = await axios.post(API_ENDPOINT, {
        message,
        history: chatHistory,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data.status !== 'success') throw new Error(response.data.message || 'Chat failed');

      // Add bot response to history
      const botResponse = { role: 'assistant', content: response.data.data.response };
      setChatHistory(prev => [...prev, botResponse]);
    } catch (error) {
      const errorMessage = { role: 'assistant', content: `Error: ${error.message}` };
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 overflow-hidden">
      {/* Parallax Background */}
      <motion.div
        className="fixed inset-0 bg-[url('https://source.unsplash.com/random/1920x1080?tech')] bg-cover bg-center opacity-30"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut', repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* Chat Container */}
      <motion.div
        className="relative max-w-2xl mx-auto mt-12 mb-6 p-6 rounded-3xl bg-gradient-to-r from-gray-800/80 to-gray-900/80 shadow-2xl backdrop-blur-lg border border-gray-700/50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-bold text-white mb-4 text-center glow-text">Modern Chatbot</h1>

        {/* Chat History */}
        <div
          ref={chatRef}
          className="max-h-96 overflow-y-auto p-4 rounded-xl bg-gray-900/50 border border-gray-700/30 scrollbar-thin scrollbar-thumb-indigo-500"
        >
          <AnimatePresence>
            {chatHistory.map((msg, index) => (
              <motion.div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div
                  className={`max-w-xs p-4 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                      : 'bg-gradient-to-r from-gray-200 to-white text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="flex mt-4 gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-3 rounded-full bg-gray-800/70 text-white border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 hover:bg-gray-700/80"
          />
          <motion.button
            onClick={sendMessage}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/50"
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            Send
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default App;