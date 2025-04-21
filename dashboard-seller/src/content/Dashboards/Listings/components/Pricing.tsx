import { FC } from 'react';
import { Grid, TextField, InputAdornment } from '@mui/material';
import { FormSection } from './FormSection';

interface PricingProps {
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
 * Component for the Pricing section of the listing creation form
 */
export const Pricing: FC<PricingProps> = ({
  formData,
  formErrors,
  handleChange
}) => {
  return (
    <FormSection title="Pricing" marginTop={2}>
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
          helperText={formErrors.price}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Original Price (Optional for Discounts)"
          name="originalPrice"
          type="number"
          value={formData.originalPrice}
          onChange={handleChange}
          InputProps={{ 
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            inputProps: { min: 0, step: "0.01" }
          }}
        />
      </Grid>
    </FormSection>
  );
};