import React, { useState, useEffect } from 'react';
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

const ImageUpload: React.FC<ImageUploadProps> = ({
  formData,
  formErrors,
  handleTextChange,
  onSubmit
}) => {
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

  // Create a custom submit handler that first uploads the image
  const handleSubmitWithUpload = async () => {
    if (!onSubmit) return;

    // First upload the image if needed
    const uploadSuccess = await handleImageUploadBeforeSubmit();

    // Only proceed with form submission if image upload was successful
    if (uploadSuccess) {
      // Call the original onSubmit function
      onSubmit();
    }
  };

  // Override the onSubmit prop to handle image upload first
  useEffect(() => {
    // Store the original onSubmit function
    const originalOnSubmit = onSubmit;

    // If we have an onSubmit function and a temporary image file
    if (originalOnSubmit && temporaryImageFile) {
      // Replace the onSubmit function with our custom one
      onSubmit = async () => {
        // First upload the image if needed
        const uploadSuccess = await handleImageUploadBeforeSubmit();

        // Only proceed with form submission if image upload was successful
        if (uploadSuccess && originalOnSubmit) {
          // Call the original onSubmit function
          originalOnSubmit();
        }
      };
    }
  }, [temporaryImageFile]);

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
};

export default ImageUpload;
