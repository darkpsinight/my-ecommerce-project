import { FC } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
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
    quantity: string;
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
            {availablePlatforms.length > 0 ? (
              availablePlatforms.map((platform) => (
                <MenuItem key={platform} value={platform}>
                  {platform}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <em>Select a category first</em>
              </MenuItem>
            )}
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
        <TextField
          fullWidth
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          InputProps={{ inputProps: { min: 1 } }}
        />
      </Grid>
    </FormSection>
  );
};