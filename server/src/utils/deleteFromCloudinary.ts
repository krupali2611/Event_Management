import { cloudinary } from '../config/cloudinary';

export async function deleteFromCloudinary(publicId?: string | null): Promise<void> {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: 'image',
  });
}
