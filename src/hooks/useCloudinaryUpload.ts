'use client';

import { useState, useCallback } from 'react';

export interface UploadedImage {
  url: string;           // https://res.cloudinary.com/... (full CDN URL)
  public_id: string;     // e.g. eyuvashop/products/abc123
  width: number;
  height: number;
  format: string;
  bytes: number;
}

interface UseCloudinaryUploadOptions {
  folder?: string;       // Cloudinary folder path
  maxSizeMB?: number;    // Max file size in MB (default 5)
  allowedFormats?: string[]; // e.g. ['jpg', 'png', 'webp']
  onSuccess?: (image: UploadedImage) => void;
  onError?: (error: string) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;      // 0–100
  error: string | null;
}

export function useCloudinaryUpload(options: UseCloudinaryUploadOptions = {}) {
  const {
    folder = 'eyuvashop',
    maxSizeMB = 5,
    allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const upload = useCallback(async (file: File): Promise<UploadedImage | null> => {
    // Client-side validation
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = `File too large. Max size is ${maxSizeMB}MB.`;
      setState({ isUploading: false, progress: 0, error: msg });
      onError?.(msg);
      return null;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedFormats.includes(ext)) {
      const msg = `Invalid file type. Allowed: ${allowedFormats.join(', ')}`;
      setState({ isUploading: false, progress: 0, error: msg });
      onError?.(msg);
      return null;
    }

    setState({ isUploading: true, progress: 10, error: null });

    try {
      // Step 1: Get signed params from our secure server endpoint
      const signRes = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });

      if (!signRes.ok) {
        throw new Error('Failed to get upload signature');
      }

      const { signature, timestamp, api_key, cloud_name, folder: signedFolder } = await signRes.json();

      setState((s) => ({ ...s, progress: 25 }));

      // Step 2: Upload directly to Cloudinary using signed params
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', String(timestamp));
      formData.append('api_key', api_key);
      formData.append('folder', signedFolder);

      // Use XMLHttpRequest for upload progress tracking
      const result = await new Promise<UploadedImage>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const cloudName = cloud_name || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round(25 + (e.loaded / e.total) * 65);
            setState((s) => ({ ...s, progress: pct }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve({
              url: data.secure_url,
              public_id: data.public_id,
              width: data.width,
              height: data.height,
              format: data.format,
              bytes: data.bytes,
            });
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.send(formData);
      });

      setState({ isUploading: false, progress: 100, error: null });
      onSuccess?.(result);
      return result;

    } catch (err: any) {
      const msg = err?.message || 'Upload failed. Please try again.';
      setState({ isUploading: false, progress: 0, error: msg });
      onError?.(msg);
      return null;
    }
  }, [folder, maxSizeMB, allowedFormats, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null });
  }, []);

  return {
    upload,
    reset,
    isUploading: state.isUploading,
    progress: state.progress,
    error: state.error,
  };
}
