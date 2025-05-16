import React from 'react';
import { Grid, TextField, Typography, useMediaQuery, useTheme, CardContent, FormHelperText } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { SectionCard, SectionTitle, EditorContainer } from '../components/StyledComponents';

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
  handleBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleDescriptionChange: (value: string) => void;
}

/**
 * Basic Information section of the create listing form
 */
const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  formData,
  formErrors,
  handleChange,
  handleBlur,
  handleDescriptionChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">
          Basic Information
        </SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Thumbnail URL"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://example.com/image.jpg"
              error={!!formErrors.thumbnailUrl}
              helperText={formErrors.thumbnailUrl || "URL for the product image"}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Description <span style={{ color: 'red' }}>*</span>
            </Typography>
            <EditorContainer className={formErrors.description ? 'error' : ''}>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                modules={modules}
                style={{ minHeight: isMobile ? '120px' : '150px' }}
                placeholder="Provide a detailed description of your product. Include important features, usage instructions, and any other information buyers should know."
              />
              {formErrors.description && (
                <FormHelperText error>
                  {formErrors.description}
                </FormHelperText>
              )}
            </EditorContainer>
          </Grid>
        </Grid>
      </CardContent>
    </SectionCard>
  );
};

export default BasicInformationSection;
