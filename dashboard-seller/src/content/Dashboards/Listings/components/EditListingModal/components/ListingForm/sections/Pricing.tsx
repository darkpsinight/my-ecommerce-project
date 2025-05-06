import React from 'react';
import {
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Box,
  Chip
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { FormData, FormErrors } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer } from '../components/StyledComponents';

interface PricingProps {
  formData: FormData;
  formErrors: FormErrors;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  getDiscountPercentage: () => string;
}

const Pricing: React.FC<PricingProps> = ({
  formData,
  formErrors,
  handleTextChange,
  getDiscountPercentage
}) => {
  const discountPercentage = getDiscountPercentage();
  const hasDiscount = !!formData.originalPrice && parseFloat(formData.originalPrice) > parseFloat(formData.price || '0');

  return (
    <SectionContainer>
      <SectionHeader icon="money" title="Pricing" />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleTextChange}
            error={!!formErrors.price}
            helperText={formErrors.price || 'Enter the selling price'}
            variant="outlined"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoneyIcon />
                </InputAdornment>
              )
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Original Price (Optional)"
            name="originalPrice"
            type="number"
            value={formData.originalPrice}
            onChange={handleTextChange}
            variant="outlined"
            helperText="Leave blank if there's no discount"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoneyIcon />
                </InputAdornment>
              )
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {hasDiscount && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                You're offering a discount of:
              </Typography>
              <Chip
                label={`${discountPercentage}% OFF`}
                color="success"
                size="small"
                variant="outlined"
              />
            </Box>
          </Grid>
        )}
      </Grid>
    </SectionContainer>
  );
};

export default Pricing;
