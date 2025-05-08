import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Box,
  Chip,
  Slider,
  Stack,
  useTheme
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
  const theme = useTheme();
  const discountPercentage = getDiscountPercentage();
  const hasDiscount = !!formData.originalPrice && parseFloat(formData.originalPrice) > parseFloat(formData.price || '0');

  // State for slider values
  const [priceValue, setPriceValue] = useState<number>(parseFloat(formData.price) || 0);
  const [originalPriceValue, setOriginalPriceValue] = useState<number>(parseFloat(formData.originalPrice) || 0);

  // Update slider values when form data changes
  useEffect(() => {
    setPriceValue(parseFloat(formData.price) || 0);
    setOriginalPriceValue(parseFloat(formData.originalPrice) || 0);
  }, [formData.price, formData.originalPrice]);

  // Handle price slider change
  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setPriceValue(value);

    // Create synthetic event to match the expected handleTextChange interface
    const syntheticEvent = {
      target: {
        name: 'price',
        value: value.toString()
      }
    } as React.ChangeEvent<HTMLInputElement>;

    handleTextChange(syntheticEvent);
  };

  // Handle original price slider change
  const handleOriginalPriceChange = (_event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setOriginalPriceValue(value);

    // Create synthetic event to match the expected handleTextChange interface
    const syntheticEvent = {
      target: {
        name: 'originalPrice',
        value: value.toString()
      }
    } as React.ChangeEvent<HTMLInputElement>;

    handleTextChange(syntheticEvent);
  };

  return (
    <SectionContainer>
      <SectionHeader icon="money" title="Pricing" />
      <Grid container spacing={3}>
        {/* Price Slider */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Price*
            </Typography>
            <Stack spacing={2} direction="row" alignItems="center" sx={{ mb: 1 }}>
              <AttachMoneyIcon color="primary" />
              <Slider
                value={priceValue}
                onChange={handlePriceChange}
                aria-labelledby="price-slider"
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={0.01}
                sx={{
                  color: theme.palette.primary.main,
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: theme.palette.primary.main
                  }
                }}
              />
              <Box sx={{ minWidth: 80 }}>
                <TextField
                  size="small"
                  value={priceValue}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      handlePriceChange(null as any, value);
                    }
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0, step: 0.01, style: { textAlign: 'right' } }
                  }}
                />
              </Box>
            </Stack>
            {formErrors.price && (
              <Typography color="error" variant="caption">
                {formErrors.price}
              </Typography>
            )}
            {!formErrors.price && (
              <Typography variant="caption" color="textSecondary">
                Enter the selling price
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Original Price Slider */}
        <Grid item xs={12}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Original Price (Optional)
            </Typography>
            <Stack spacing={2} direction="row" alignItems="center" sx={{ mb: 1 }}>
              <AttachMoneyIcon color="action" />
              <Slider
                value={originalPriceValue}
                onChange={handleOriginalPriceChange}
                aria-labelledby="original-price-slider"
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={0.01}
                sx={{
                  color: theme.palette.grey[500],
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: theme.palette.grey[700]
                  }
                }}
              />
              <Box sx={{ minWidth: 80 }}>
                <TextField
                  size="small"
                  value={originalPriceValue}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      handleOriginalPriceChange(null as any, value);
                    }
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0, step: 0.01, style: { textAlign: 'right' } }
                  }}
                />
              </Box>
            </Stack>
            <Typography variant="caption" color="textSecondary">
              Leave blank if there's no discount
            </Typography>
          </Box>
        </Grid>

        {/* Discount Display */}
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
