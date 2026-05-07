import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/response';

function ensureUploadsDir(folder: string): string {
  const uploadsRoot = path.join(process.cwd(), 'uploads', folder);
  fs.mkdirSync(uploadsRoot, { recursive: true });
  return uploadsRoot;
}

function createImageStorage(folder: string, fallbackName: string) {
  const uploadsRoot = ensureUploadsDir(folder);

  return multer.diskStorage({
    destination: (_request, _file, callback) => {
      callback(null, uploadsRoot);
    },
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname) || '.jpg';
      const baseName = path
        .basename(file.originalname, extension)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);

      callback(null, `${baseName || fallbackName}-${Date.now()}${extension}`);
    },
  });
}

function fileFilter(_request: Express.Request, file: Express.Multer.File, callback: multer.FileFilterCallback): void {
  if (!file.mimetype.startsWith('image/')) {
    callback(new AppError('Only image files are allowed', 400));
    return;
  }

  callback(null, true);
}

export const venueImageUpload = multer({
  storage: createImageStorage('venues', 'venue'),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

export const eventImageUpload = multer({
  storage: createImageStorage('events', 'event'),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 9,
  },
  fileFilter,
});
