const multer = require('multer');

// Use memory storage for fast, clean in-memory Excel processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(xlsx|xls)$/i;
  const isMatch = allowedExtensions.test(file.originalname);
  if (isMatch) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel spreadsheet files (.xlsx or .xls) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB maximum
  },
  fileFilter
});

module.exports = upload;
