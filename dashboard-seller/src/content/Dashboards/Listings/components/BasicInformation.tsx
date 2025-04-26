import { FC, useRef, useEffect } from 'react';
import { Grid, TextField, styled, Typography } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's snow theme CSS
import { FormSection } from './FormSection';

interface BasicInformationProps {
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
}

/**
 * Styled container for the Quill editor to match Material-UI theme
 */
const EditorContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  '& .ql-container': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '0 0 4px 4px',
    background: theme.palette.background.paper,
    minHeight: '150px',
    fontFamily: theme.typography.fontFamily,
  },
  '& .ql-toolbar': {
    background: theme.palette.grey[100],
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  },
  // Error state styling
  '&.error .ql-container': {
    border: `1px solid ${theme.palette.error.main}`,
  },
  '&.error .ql-toolbar': {
    borderColor: theme.palette.error.main,
  },
  // Helper text styling
  '& .MuiFormHelperText-root': {
    marginLeft: '14px',
    marginTop: '4px',
    color: theme.palette.text.secondary,
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  // Placeholder styling
  '& .ql-editor.ql-blank::before': {
    color: theme.palette.text.secondary,
    fontStyle: 'normal',
    opacity: 0.7,
  }
}));

/**
 * Component for the Basic Information section of the listing creation form
 */
export const BasicInformation: FC<BasicInformationProps> = ({
  formData,
  formErrors,
  handleChange,
  handleBlur,
}) => {
  const quillRef = useRef<ReactQuill>(null);

  // Custom handleChange for ReactQuill to mimic TextField's onChange
  const handleDescriptionChange = (value: string) => {
    const syntheticEvent = {
      target: {
        name: 'description',
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  };

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <FormSection title="Basic Information">
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Steam Game Key for Cyberpunk 2077"
          error={!!formErrors.title}
          helperText={formErrors.title}
          required
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
          helperText={formErrors.thumbnailUrl}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          Description <span style={{ color: 'red' }}>*</span>
        </Typography>
        <EditorContainer className={formErrors.description ? 'error' : ''}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={formData.description}
            onChange={handleDescriptionChange}
            modules={modules}
            style={{ minHeight: '200px' }}
            placeholder="Provide a detailed description of your product. Include important features, usage instructions, and any other information buyers should know. For digital products, specify platform compatibility, activation instructions, and any expiration details."
          />
          {formErrors.description && (
            <div className="MuiFormHelperText-root Mui-error" style={{ fontWeight: 'bold' }}>
              {formErrors.description}
            </div>
          )}
        </EditorContainer>
      </Grid>
    </FormSection>
  );
};