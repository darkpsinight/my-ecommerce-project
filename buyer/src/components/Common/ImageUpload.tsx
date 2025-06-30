"use client";
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadImage, processImage, IMAGE_FOLDERS } from '@/services/imageUpload';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  folder?: string;
  token: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  onUploadStart,
  onUploadEnd,
  folder = IMAGE_FOLDERS.BUYER_PROFILE_IMAGES,
  token,
  className = '',
  size = 'medium'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  const buttonSizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      onUploadStart?.();

      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Process the image
      const processedFile = await processImage(file);

      // Upload the image
      const imageUrl = await uploadImage(processedFile, folder, token);
      
      // Clean up preview URL
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);

      onImageUploaded(imageUrl);
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      
      // Clean up preview URL on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      onUploadEnd?.();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const displayImageUrl = previewUrl || currentImageUrl || '/images/users/user-04.jpg';

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-white shadow-lg">
        <Image
          src={displayImageUrl}
          alt="Profile"
          width={size === 'small' ? 64 : size === 'medium' ? 128 : 192}
          height={size === 'small' ? 64 : size === 'medium' ? 128 : 192}
          className="w-full h-full object-cover"
        />
        
        {/* Upload overlay when uploading */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
              <span className="text-white text-xs font-medium">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit button */}
      <button
        onClick={handleEditClick}
        disabled={isUploading}
        className={`absolute bottom-0 right-0 ${buttonSizeClasses[size]} bg-blue rounded-full flex items-center justify-center text-white hover:bg-blue-dark transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Change profile picture"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;