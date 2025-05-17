import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Grid,
  Box,
  Typography,
  Alert,
  useTheme
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import { FormData, FormErrors } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer } from '../components/StyledComponents';
import ImageUploadComponent from 'src/components/ImageUpload';
import { uploadImage } from 'src/services/api/imageUpload';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
  formData: FormData;
  formErrors: FormErrors;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  onSubmit?: () => void; // For form submission
}

// Define the ref interface
export interface ImageUploadRef {
  uploadImageBeforeSubmit: () => Promise<boolean>;
  hasTemporaryImage: () => boolean;
}

const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>((props, ref) => {
  const { formData, formErrors, handleTextChange, onSubmit } = props;
  const theme = useTheme();
  const [temporaryImageFile, setTemporaryImageFile] = useState<File | null>(null);
  const [imageUploadInProgress, setImageUploadInProgress] = useState<boolean>(false);

  // Handle image file selection
  const handleImageFileSelect = (file: File | null) => {
    setTemporaryImageFile(file);
  };

  // Handle image upload before form submission
  const handleImageUploadBeforeSubmit = async () => {
    if (temporaryImageFile) {
      try {
        setImageUploadInProgress(true);

        // Upload the image to ImageKit.io
        const imageUrl = await uploadImage(temporaryImageFile);

        // Update the form data with the new image URL
        const syntheticEvent = {
          target: {
            name: 'thumbnailUrl',
            value: imageUrl
          }
        } as React.ChangeEvent<HTMLInputElement>;
        handleTextChange(syntheticEvent);

        // Clear the temporary file
        setTemporaryImageFile(null);

        return true;
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image. Please try again.');
        return false;
      } finally {
        setImageUploadInProgress(false);
      }
    }

    return true; // No image to upload, proceed with form submission
  };

  // Handle URL change
  const handleUrlChange = (url: string) => {
    const syntheticEvent = {
      target: {
        name: 'thumbnailUrl',
        value: url
      }
    } as React.ChangeEvent<HTMLInputElement>;
    handleTextChange(syntheticEvent);
  };

  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    // Method to upload image before form submission
    uploadImageBeforeSubmit: async () => {
      console.log('uploadImageBeforeSubmit called, temporaryImageFile:', temporaryImageFile ? temporaryImageFile.name : 'none');
      return handleImageUploadBeforeSubmit();
    },
    // Method to check if there's a temporary image that needs to be uploaded
    hasTemporaryImage: () => {
      return temporaryImageFile !== null;
    }
  }));

  return (
    <SectionContainer className="image-upload-component">
      <SectionHeader icon={<ImageIcon />} title="Product Thumbnail" />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ImageUploadComponent
            value={formData.thumbnailUrl}
            onChange={(url) => {
              const syntheticEvent = {
                target: {
                  name: 'thumbnailUrl',
                  value: url
                }
              } as React.ChangeEvent<HTMLInputElement>;
              handleTextChange(syntheticEvent);
            }}
            error={formErrors.thumbnailUrl}
            isEditListing={true}
            onFileSelect={handleImageFileSelect}
            temporaryFile={temporaryImageFile}
            uploadInProgress={imageUploadInProgress}
            onUrlChange={handleUrlChange}
          />
        </Grid>
      </Grid>
    </SectionContainer>
  );
});

export default ImageUpload;
