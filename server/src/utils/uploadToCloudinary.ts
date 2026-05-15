import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type { Request } from 'express';
import { AppError } from './response';

export interface UploadedCloudinaryImage {
  secureUrl: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

const uploadsRoot = path.resolve(process.cwd(), 'uploads');

const mimeTypeToExtension: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function getFileExtension(file: Express.Multer.File): string {
  const extension = mimeTypeToExtension[file.mimetype.toLowerCase()];

  if (!extension) {
    throw new AppError('Unsupported image format', 400);
  }

  return extension;
}

function buildUploadedFileUrl(request: Request, publicId: string): string {
  const protocol = request.get('x-forwarded-proto') ?? request.protocol;
  return `${protocol}://${request.get('host')}/uploads/${publicId}`;
}

export async function uploadToCloudinary(
  request: Request,
  file: Express.Multer.File,
  options: { folder: string },
): Promise<UploadedCloudinaryImage> {
  if (!file.buffer?.length) {
    throw new AppError('Uploaded file is empty', 400);
  }

  const extension = getFileExtension(file);
  const normalizedFolder = options.folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const fileName = `${randomUUID()}.${extension}`;
  const publicId = path.posix.join(normalizedFolder, fileName);
  const absoluteDirectory = path.resolve(uploadsRoot, normalizedFolder);
  const absoluteFilePath = path.resolve(absoluteDirectory, fileName);

  if (!absoluteFilePath.startsWith(uploadsRoot)) {
    throw new AppError('Invalid upload destination', 500);
  }

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(absoluteFilePath, file.buffer);

  return {
    secureUrl: buildUploadedFileUrl(request, publicId),
    publicId,
    format: extension,
    bytes: file.size,
  };
}
