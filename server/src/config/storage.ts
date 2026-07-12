import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Ensure local uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure Cloudinary if keys are present
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary storage engine configured.');
} else {
  console.log('Cloudinary env vars missing. Using local uploads directory.');
}

// Multer Local Storage Configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter (PDF only, max 5MB)
const fileFilter = (req: any, file: any, cb: any) => {
  const filetypes = /pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only PDF resume files are allowed!'), false);
};

export const upload = multer({
  storage: localStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

// Cloudinary Uploader function with local fallback
export const uploadToCloudinaryOrLocal = async (localFilePath: string): Promise<string> => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: 'placepilot_resumes',
        resource_type: 'raw', // PDF needs raw or auto resource type in Cloudinary
      });
      // Delete local temp file after upload to Cloudinary
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed. Falling back to local storage URL.', error);
      // Return local relative path if Cloudinary fails
      const filename = path.basename(localFilePath);
      return `/uploads/${filename}`;
    }
  } else {
    // Return local relative path
    const filename = path.basename(localFilePath);
    return `/uploads/${filename}`;
  }
};
