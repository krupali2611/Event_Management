import { unlink } from 'fs/promises';
import path from 'path';

export async function deleteFromCloudinary(publicId?: string | null): Promise<void> {
  if (!publicId) {
    return;
  }

  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const normalizedPublicId = publicId.replace(/\\/g, '/').replace(/^\/+/, '');
  const absoluteFilePath = path.resolve(uploadsRoot, normalizedPublicId);

  if (!absoluteFilePath.startsWith(uploadsRoot)) {
    return;
  }

  try {
    await unlink(absoluteFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
