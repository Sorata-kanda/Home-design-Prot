const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for room photos
const roomPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'arteffects/room-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto' }]
  }
});

// Storage for product textures
const textureStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'arteffects/textures',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 2048, height: 2048, crop: 'limit', quality: 95 }]
  }
});

// Storage for generated renders
const renderStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'arteffects/renders',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 90 }]
  }
});

exports.uploadRoomPhoto = multer({
  storage: roomPhotoStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
}).single('photo');

exports.uploadTexture = multer({
  storage: textureStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
}).fields([
  { name: 'texture', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'gallery', maxCount: 6 }
]);

exports.cloudinary = cloudinary;
