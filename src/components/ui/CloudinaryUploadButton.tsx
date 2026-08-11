'use client';

import React from 'react';
import { useCloudinaryUpload, UploadedImage } from '@/hooks/useCloudinaryUpload';

interface CloudinaryUploadButtonProps {
  folder: string;
  onUpload: (image: UploadedImage) => void;
  maxSizeMB?: number;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  currentImageUrl?: string;
  accept?: string;
}

export function CloudinaryUploadButton({
  folder,
  onUpload,
  maxSizeMB = 5,
  label = 'Upload Image',
  className = '',
  children,
  currentImageUrl,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
}: CloudinaryUploadButtonProps) {
  const { upload, isUploading, progress, error } = useCloudinaryUpload({
    folder,
    maxSizeMB,
    onSuccess: onUpload,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload(file);
    e.target.value = '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="relative cursor-pointer block">
        <input
          type="file"
          accept={accept}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {children || (
          <div className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg text-sm font-medium transition-colors ${
            isUploading
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-gray-200 text-gray-700 hover:border-[#FF6B00] hover:text-[#FF6B00]'
          }`}>
            {isUploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading... {progress}%
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {label}
              </>
            )}
          </div>
        )}
      </label>

      {/* Progress Bar */}
      {isUploading && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#FF6B00] h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Current Image Preview */}
      {currentImageUrl && !isUploading && (
        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImageUrl}
            alt="Uploaded"
            className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">Image uploaded</p>
            <p className="text-xs text-gray-400 truncate">{currentImageUrl.split('/').pop()}</p>
          </div>
          <svg className="w-4 h-4 text-green-500 shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

// Re-export UploadedImage for convenience
export type { UploadedImage };
