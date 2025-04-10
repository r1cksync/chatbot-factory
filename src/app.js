const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const chatbotRoutes = require('./routes/chatbotRoutes');
const userRoutes = require('./routes/userRoutes');
const config = require('./config/server');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: config.rateLimit.window,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

app.use('/api/v1/chatbots', chatbotRoutes);
app.use('/api/v1/users', userRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

app.use(errorHandler);

module.exports = app;