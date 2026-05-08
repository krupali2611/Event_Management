import type { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';
import { AppError } from './response';

export interface UploadedCloudinaryImage {
  secureUrl: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

export async function uploadToCloudinary(
  file: Express.Multer.File,
  options: Pick<UploadApiOptions, 'folder'>,
): Promise<UploadedCloudinaryImage> {
  if (!file.buffer?.length) {
    throw new AppError('Uploaded file is empty', 400);
  }

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: 'image',
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);
          return;
        }

        if (!uploadResult) {
          reject(new AppError('Cloudinary upload failed', 502));
          return;
        }

        resolve(uploadResult);
      },
    );

    stream.end(file.buffer);
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
  };
}
