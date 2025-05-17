import React from 'react';
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

interface ImageUploadProps {
  formData: FormData;
  formErrors: FormErrors;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  formData,
  formErrors,
  handleTextChange
}) => {
  const theme = useTheme();

  return (
    <SectionContainer>
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
          />
        </Grid>
      </Grid>
    </SectionContainer>
  );
};

export default ImageUpload;
