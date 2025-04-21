import { FC } from 'react';
import { Grid, TextField } from '@mui/material';
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
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Component for the Basic Information section of the listing creation form
 */
export const BasicInformation: FC<BasicInformationProps> = ({
  formData,
  formErrors,
  handleChange
}) => {
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
          placeholder="https://example.com/image.jpg"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          multiline
          rows={4}
          placeholder="Detailed description of what this code unlocks, any restrictions, etc."
          error={!!formErrors.description}
          helperText={formErrors.description}
          required
        />
      </Grid>
    </FormSection>
  );
};