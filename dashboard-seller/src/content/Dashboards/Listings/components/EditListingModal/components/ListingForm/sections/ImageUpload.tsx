import React from 'react';
import {
  Grid,
  TextField,
  Box,
  Typography,
  Alert,
  useTheme
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import { FormData, FormErrors } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer } from '../components/StyledComponents';

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
          <TextField
            fullWidth
            label="Thumbnail URL"
            name="thumbnailUrl"
            value={formData.thumbnailUrl}
            onChange={handleTextChange}
            error={!!formErrors.thumbnailUrl}
            helperText={formErrors.thumbnailUrl || 'Enter a URL for the product thumbnail image'}
            variant="outlined"
            placeholder="https://example.com/image.jpg"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          {formData.thumbnailUrl ? (
            <Box
              sx={{
                mt: 2,
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                textAlign: 'center'
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Image Preview
              </Typography>
              <img
                src={formData.thumbnailUrl}
                alt="Thumbnail Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
                onError={(e) => {
                  const width =
                    window.innerWidth > theme.breakpoints.values.md
                      ? 800
                      : window.innerWidth > theme.breakpoints.values.sm
                      ? 600
                      : 400;
                  if (e.currentTarget.src !== formData.thumbnailUrl) {
                    e.currentTarget.src = formData.thumbnailUrl;
                    return;
                  }
                  const svg = encodeURIComponent(`
                    <svg width="${width}" height="${Math.round(
                    width * 0.66
                  )}" 
                         xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="#e0e0e0"/>
                      <text x="50%" y="50%" dominant-baseline="middle" 
                            text-anchor="middle" font-family="Arial" 
                            font-size="20" fill="#666">
                        Thumbnail Preview
                      </text>
                    </svg>
                  `);
                  e.currentTarget.src = `data:image/svg+xml,${svg}`;
                }}
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              Enter a URL to see the image preview
            </Alert>
          )}
        </Grid>
      </Grid>
    </SectionContainer>
  );
};

export default ImageUpload;
