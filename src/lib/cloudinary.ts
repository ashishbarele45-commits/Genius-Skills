import { apiRequest } from './api';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
}

/**
 * Securely uploads a file to Cloudinary using a server-side signed signature.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'genius-skills',
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> {
  // 1. Get signature from our backend
  const { timestamp, signature, api_key, cloud_name } = await apiRequest(`/api/media/sign?folder=${folder}`);

  // 2. Upload directly to Cloudinary
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } else {
        const error = JSON.parse(xhr.responseText);
        console.error('Cloudinary upload error:', error);
        reject(new Error(error.error?.message || 'Cloudinary upload failed'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during Cloudinary upload'));
    };

    xhr.send(formData);
  });
}

/**
 * Deletes a resource from Cloudinary via our backend.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await apiRequest(`/api/media/${encodeURIComponent(publicId)}`, {
    method: 'DELETE',
  });
}
