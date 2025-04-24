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
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    const event = {
      target: {
        name: e.target.name,
        value: e.target.checked
      }
    };
    handleChange(event as any);
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
              <MenuItem key={region} value={region}>
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