const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const maxSize = 20 * 1024 * 1024; // 20MB

// Function to generate a unique filename
const generateUniqueFilename = (originalname) => {
  const ext = path.extname(originalname);
  const randomString = crypto.randomBytes(8).toString("hex");
  return `IMG-${Date.now()}-${randomString}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    cb(null, uniqueFilename);
  },
});

const imageFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("File format not supported."), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxSize },
}).single("image"); // Assuming the field name for the image is 'image'

module.exports = upload;
