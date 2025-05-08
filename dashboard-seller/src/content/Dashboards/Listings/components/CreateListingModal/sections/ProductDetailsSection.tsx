import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
  CardContent
} from '@mui/material';
import { SectionCard, SectionTitle } from '../components/StyledComponents';

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface ProductDetailsSectionProps {
  formData: {
    categoryId: string;
    platform: string;
    region: string;
    isRegionLocked: boolean;
  };
  formErrors: {
    categoryId?: string;
    platform?: string;
    region?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categories: Category[];
  availablePlatforms: string[];
  regions: string[];
}

/**
 * Product Details section of the create listing form
 */
const ProductDetailsSection: React.FC<ProductDetailsSectionProps> = ({
  formData,
  formErrors,
  handleChange,
  handleCheckboxChange,
  categories,
  availablePlatforms,
  regions
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">
          Product Details
        </SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.categoryId} required size={isMobile ? "small" : "medium"}>
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
            <FormControl fullWidth error={!!formErrors.platform} required size={isMobile ? "small" : "medium"}>
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
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!formErrors.region} required size={isMobile ? "small" : "medium"}>
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
          <Grid item xs={12} sm={6}>
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
        </Grid>
      </CardContent>
    </SectionCard>
  );
};

export default ProductDetailsSection;
