require('dotenv').config();

const uri = process.env.MONGODB_URI;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

module.exports = { uri, options };