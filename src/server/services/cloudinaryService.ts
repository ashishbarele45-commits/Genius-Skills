import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with secure environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ntspltr3',
  api_key: process.env.CLOUDINARY_API_KEY || '764264895418593',
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export interface SignedUploadParams {
  timestamp: number;
  signature: string;
  api_key: string;
  cloud_name: string;
  folder?: string;
}

/**
 * Generates a signed upload signature for secure client-side uploads.
 * This prevents exposing the API Secret to the frontend.
 */
export function generateSignature(folder: string = 'genius-skills'): SignedUploadParams {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: folder,
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY || '764264895418593',
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ntspltr3',
    folder,
  };
}

/**
 * Deletes a resource from Cloudinary by its public ID.
 */
export async function deleteResource(publicId: string, resourceType: 'image' | 'video' = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw error;
  }
}

export default cloudinary;
