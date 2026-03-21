const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Set up storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomnumber-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  
  const ext = path.extname(file.originalname).toLowerCase()
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF)'), false)
  }
}

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
})

module.exports = upload
