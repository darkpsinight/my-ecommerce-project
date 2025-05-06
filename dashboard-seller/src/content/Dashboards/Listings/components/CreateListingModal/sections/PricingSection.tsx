import React from 'react';
import {
  Grid,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  CardContent
} from '@mui/material';
import { SectionCard, SectionTitle } from '../components/StyledComponents';

interface PricingSectionProps {
  formData: {
    price: string;
    originalPrice: string;
  };
  formErrors: {
    price?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Pricing section of the create listing form
 */
const PricingSection: React.FC<PricingSectionProps> = ({
  formData,
  formErrors,
  handleChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">
          Pricing
        </SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              InputProps={{ 
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, step: "0.01" }
              }}
              error={!!formErrors.price}
              helperText={formErrors.price || "Enter the selling price"}
              required
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Original Price (Optional)"
              name="originalPrice"
              type="number"
              value={formData.originalPrice}
              onChange={handleChange}
              InputProps={{ 
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, step: "0.01" }
              }}
              helperText="Set this higher than the price to show a discount"
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
        </Grid>
      </CardContent>
    </SectionCard>
  );
};

export default PricingSection;
