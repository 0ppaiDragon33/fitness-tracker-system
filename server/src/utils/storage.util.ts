import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToStorage = async (
  file: any,
  folder = 'workouts'
): Promise<{ url: string; path: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error);

        resolve({
          url: result.secure_url,
          path: result.public_id,
        });
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

export const deleteFromStorage = async (filePath: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(filePath);
  } catch {}
};