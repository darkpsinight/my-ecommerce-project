import { FC } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  ListItemText
} from '@mui/material';
import { FormSection } from './FormSection';

interface Category {
  _id: string;
  name: string;
  description?: string;
}

// Define a custom type for the multi-field update
type MultiFieldUpdate = {
  fields: Record<string, any>;
};

interface ProductDetailsProps {
  formData: {
    categoryId: string;
    platform: string;
    region: string;
    isRegionLocked: boolean;
    supportedLanguages: string[];
  };
  formErrors: {
    categoryId?: string;
    platform?: string;
    region?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement> | MultiFieldUpdate) => void;
  categories: Category[];
  availablePlatforms: string[];
  regions: string[];
}

/**
 * Component for the Product Details section of the listing creation form
 */
export const ProductDetails: FC<ProductDetailsProps> = ({
  formData,
  formErrors,
  handleChange,
  categories,
  availablePlatforms,
  regions
}) => {
  // Function to handle checkbox changes specifically
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIsLocked = e.target.checked;

    // Create an object with all fields that need to be updated
    const fieldsToUpdate: Record<string, any> = {
      [e.target.name]: newIsLocked
    };

    // Update region value based on the new isRegionLocked state
    if (newIsLocked && formData.region === 'Global') {
      // If enabling region lock and region is Global, clear the region
      fieldsToUpdate.region = '';
    } else if (!newIsLocked && formData.region !== 'Global') {
      // If disabling region lock, set region to Global
      fieldsToUpdate.region = 'Global';
    }

    // Use a custom fields object to update multiple fields at once
    handleChange({ fields: fieldsToUpdate });
  };

  return (
    <FormSection title="Product Details" marginTop={2}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth error={!!formErrors.categoryId} required>
          <InputLabel>Category</InputLabel>
          <Select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange as any}
            label="Category"
          >
            {categories.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
          {formErrors.categoryId && (
            <FormHelperText>{formErrors.categoryId}</FormHelperText>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth error={!!formErrors.platform} required>
          <InputLabel>Platform</InputLabel>
          <Select
            name="platform"
            value={formData.platform}
            onChange={handleChange as any}
            label="Platform"
          >
            {formData.categoryId === '' && (
              <MenuItem disabled value="">
                <em>Please choose a category first</em>
              </MenuItem>
            )}
            {availablePlatforms.map((platform) => (
              <MenuItem key={platform} value={platform}>
                {platform}
              </MenuItem>
            ))}
          </Select>
          {formErrors.platform && (
            <FormHelperText>{formErrors.platform}</FormHelperText>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth error={!!formErrors.region} required>
          <InputLabel>Region</InputLabel>
          <Select
            name="region"
            value={formData.region}
            onChange={handleChange as any}
            label="Region"
          >
            {regions.map((region) => (
              <MenuItem
                key={region}
                value={region}
                disabled={(region === 'Global' && formData.isRegionLocked) ||
                         (region !== 'Global' && !formData.isRegionLocked)}
              >
                {region}
              </MenuItem>
            ))}
          </Select>
          {formErrors.region && (
            <FormHelperText>{formErrors.region}</FormHelperText>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControlLabel
          control={
            <Checkbox
              name="isRegionLocked"
              checked={Boolean(formData.isRegionLocked)}
              onChange={handleCheckboxChange}
              color="primary"
            />
          }
          label="Region Locked?"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Supported Languages</InputLabel>
          <Select
            name="supportedLanguages"
            multiple
            value={formData.supportedLanguages}
            onChange={handleChange as any}
            label="Supported Languages"
            renderValue={(selected) => (selected as string[]).join(', ')}
          >
            {['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Other'].map((lang) => (
              <MenuItem key={lang} value={lang}>
                <Checkbox checked={formData.supportedLanguages.indexOf(lang) > -1} />
                <ListItemText primary={lang} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </FormSection>
  );
};