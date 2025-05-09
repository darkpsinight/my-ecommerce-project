import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
  CardContent,
  Slider,
  Typography,
  Box,
  Stack
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
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

  // State for slider values
  const [priceValue, setPriceValue] = useState<number>(
    parseFloat(formData.price) || 0
  );
  const [originalPriceValue, setOriginalPriceValue] = useState<number>(
    parseFloat(formData.originalPrice) || 0
  );

  // Update slider values when form data changes
  useEffect(() => {
    setPriceValue(parseFloat(formData.price) || 0);
    setOriginalPriceValue(parseFloat(formData.originalPrice) || 0);
  }, [formData.price, formData.originalPrice]);

  // Handle price slider change
  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setPriceValue(value);

    // Create synthetic event to match the expected handleChange interface
    const syntheticEvent = {
      target: {
        name: 'price',
        value: value.toString()
      }
    } as React.ChangeEvent<HTMLInputElement>;

    handleChange(syntheticEvent);
  };

  // Handle original price slider change
  const handleOriginalPriceChange = (
    _event: Event,
    newValue: number | number[]
  ) => {
    const value = newValue as number;
    setOriginalPriceValue(value);

    // Create synthetic event to match the expected handleChange interface
    const syntheticEvent = {
      target: {
        name: 'originalPrice',
        value: value.toString()
      }
    } as React.ChangeEvent<HTMLInputElement>;

    handleChange(syntheticEvent);
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (
      originalPriceValue > 0 &&
      priceValue > 0 &&
      originalPriceValue > priceValue
    ) {
      const discount =
        ((originalPriceValue - priceValue) / originalPriceValue) * 100;
      return discount.toFixed(0);
    }
    return '0';
  };

  // Check if there's a discount
  const hasDiscount =
    originalPriceValue > 0 && priceValue > 0 && originalPriceValue > priceValue;

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">Pricing</SectionTitle>
        <Grid container spacing={3}>
          {/* Price Slider */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Price*
              </Typography>
              <Stack
                spacing={2}
                direction="row"
                alignItems="center"
                sx={{ mb: 1 }}
              >
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
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                      inputProps: {
                        min: 0,
                        step: 0.01,
                        style: { textAlign: 'right' }
                      }
                    }}
                  />
                </Box>
              </Stack>
              {formErrors.price && (
                <Typography color="error" sx={{ fontWeight: 'bold' }}>
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
              <Stack
                spacing={2}
                direction="row"
                alignItems="center"
                sx={{ mb: 1 }}
              >
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
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                      inputProps: {
                        min: 0,
                        step: 0.01,
                        style: { textAlign: 'right' }
                      }
                    }}
                  />
                </Box>
              </Stack>
              <Typography variant="caption" color="textSecondary">
                Set this higher than the price to show a discount
              </Typography>
            </Box>
          </Grid>

          {/* Discount Display */}
          {hasDiscount && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mr: 1 }}
                >
                  You're offering a discount of:
                </Typography>
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'success.light',
                    color: 'success.dark',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  {getDiscountPercentage()}% OFF
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </SectionCard>
  );
};

export default PricingSection;
