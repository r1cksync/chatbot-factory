const multer = require('multer');
const AppError = require('../utils/appError');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /pdf|txt/;
    const extname = fileTypes.test(file.originalname.toLowerCase());
    if (extname) return cb(null, true);
    cb(new AppError('Only PDF and TXT files are allowed', 400));
  }
});

module.exports = upload.single('file');