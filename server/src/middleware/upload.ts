import multer from 'multer';
import { AppError } from '../utils/response';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function imageFileFilter(_request: Express.Request, file: Express.Multer.File, callback: multer.FileFilterCallback): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    callback(new AppError('Only JPG, PNG, WEBP, and GIF images are allowed', 400));
    return;
  }

  callback(null, true);
}

function createImageUpload(options?: { maxFiles?: number }) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      ...(options?.maxFiles ? { files: options.maxFiles } : {}),
    },
    fileFilter: imageFileFilter,
  });
}

export const venueImageUpload = createImageUpload({ maxFiles: 1 });
export const eventImageUpload = createImageUpload({ maxFiles: 9 });
