import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  Typography,
  Autocomplete,
  Chip,
  Box,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  CardContent
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { SectionCard, SectionTitle } from '../components/StyledComponents';
import { formatProductCode } from '../utils/formatters';

interface ProductCodeSectionProps {
  formData: {
    code: string;
    expirationDate: string;
    supportedLanguages: string[];
    tags: string[];
    sellerNotes: string;
  };
  formErrors: {
    code?: string;
  };
  validationError: string;
  selectedPattern: {
    example?: string;
    description?: string;
    regex?: string;
  } | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagsChange: (event: any, newValue: string[]) => void;
}

/**
 * Product Code section of the create listing form
 */
const ProductCodeSection: React.FC<ProductCodeSectionProps> = ({
  formData,
  formErrors,
  validationError,
  selectedPattern,
  handleChange,
  handleTagsChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle code input with formatting
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatProductCode(value, selectedPattern);
    
    // Create a synthetic event with the formatted value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'code',
        value: formattedValue
      }
    };

    handleChange(syntheticEvent);
  };

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            Product Code
            <Tooltip 
              title="This code will be encrypted and securely stored. It will only be revealed to buyers after purchase." 
              arrow
            >
              <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                <InfoOutlinedIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Box>
        </SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Code"
              name="code"
              value={formData.code}
              onChange={handleCodeChange}
              placeholder={selectedPattern?.example || "Enter the exact code that buyers will receive"}
              error={Boolean(formErrors.code) || Boolean(validationError)}
              helperText={
                formErrors.code || validationError || 
                (selectedPattern ? `Format: ${selectedPattern.description || selectedPattern.regex}` : "The code your buyers will receive after purchase")
              }
              required
              size={isMobile ? "small" : "medium"}
            />
            {selectedPattern && (
              <FormHelperText sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="primary">
                  Example: {selectedPattern.example}
                </Typography>
              </FormHelperText>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Expiration Date (Optional)"
              name="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              helperText="Leave blank if the code doesn't expire"
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
                    <Typography>{lang}</Typography>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Select all languages supported by this product</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={formData.tags}
              onChange={handleTagsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip 
                    key={`tag-${option}-${index}`}
                    variant="outlined" 
                    label={option} 
                    size="small"
                    {...getTagProps({ index })} 
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Tags (Optional)"
                  placeholder="Add tags and press Enter"
                  helperText="Add keywords to help buyers find your listing"
                  size={isMobile ? "small" : "medium"}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Seller Notes (Private)"
              name="sellerNotes"
              value={formData.sellerNotes}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Private notes (not visible to buyers)"
              helperText="These notes are only visible to you"
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
        </Grid>
      </CardContent>
    </SectionCard>
  );
};

export default ProductCodeSection;
