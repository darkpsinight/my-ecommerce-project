import React from 'react';
import { Grid, TextField, Typography, useMediaQuery, useTheme, CardContent, FormHelperText } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { SectionCard, SectionTitle, EditorContainer } from '../components/StyledComponents';
import ImageUpload from 'src/components/ImageUpload';

interface BasicInformationSectionProps {
  formData: {
    title: string;
    thumbnailUrl: string;
    description: string;
  };
  formErrors: {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDescriptionChange: (value: string) => void;
}

/**
 * Basic Information section of the create listing form
 */
const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  formData,
  formErrors,
  handleChange,
  handleDescriptionChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Quill modules configuration without image upload support
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">
          Basic Information
        </SectionTitle>
        <Grid container spacing={3}>
          {/* Title - Full width on all screens */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Steam Game Key for Cyberpunk 2077"
              error={!!formErrors.title}
              helperText={formErrors.title || "Enter a descriptive title for your listing"}
              required
              size={isMobile ? "small" : "medium"}
            />
          </Grid>

          {/* Two-column layout for description and thumbnail on larger screens */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {/* Description - Full width on mobile, 60% on larger screens */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" gutterBottom>
                  Description <span style={{ color: 'red' }}>*</span>
                </Typography>
                <EditorContainer className={formErrors.description ? 'error' : ''}>
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    modules={modules}
                    style={{ minHeight: isMobile ? '120px' : '250px' }}
                    placeholder="Provide a detailed description of your product. Include important features, usage instructions, and any other information buyers should know."
                  />
                  {formErrors.description && (
                    <FormHelperText error>
                      {formErrors.description}
                    </FormHelperText>
                  )}
                </EditorContainer>
              </Grid>

              {/* Product Thumbnail - Full width on mobile, 40% on larger screens */}
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" gutterBottom>
                  Product Thumbnail
                </Typography>
                <ImageUpload
                  value={formData.thumbnailUrl}
                  onChange={(url) => {
                    const syntheticEvent = {
                      target: {
                        name: 'thumbnailUrl',
                        value: url
                      }
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleChange(syntheticEvent);
                  }}
                  error={formErrors.thumbnailUrl}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </SectionCard>
  );
};

export default BasicInformationSection;
