const { v4: uuidv4 } = require('uuid');

exports.generateApiKey = async () => `chbt_${uuidv4().replace(/-/g, '')}`;