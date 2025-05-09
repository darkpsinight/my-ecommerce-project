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
  alpha,
  CardContent,
  Button,
  Stack,
  Alert,
  Paper,
  InputAdornment,
  Divider
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import { SectionCard, SectionTitle } from '../components/StyledComponents';
import { formatProductCode } from '../utils/formatters';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { CodeItem } from '../types';
import PaginatedCodesTable from '../components/PaginatedCodesTable';

interface ProductCodeSectionProps {
  formData: {
    codes: CodeItem[];
    newCode: string;
    newExpirationDate: string | Date | null;
    supportedLanguages: string[];
    tags: string[];
    sellerNotes: string;
  };
  formErrors: {
    newCode?: string;
    codes?: string;
  };
  validationError: string;
  selectedPattern: {
    example?: string;
    description?: string;
    regex?: string;
  } | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagsChange: (event: any, newValue: string[]) => void;
  handleDateChange?: (date: Date | null) => void;
  handleAddCode?: () => void;
  handleDeleteCode?: (code: string) => void;
  handleCodeKeyDown?: (e: React.KeyboardEvent) => void;
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
  handleTagsChange,
  handleDateChange,
  handleAddCode,
  handleDeleteCode,
  handleCodeKeyDown
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
        name: 'newCode',
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
            Product Codes
            <Tooltip
              title="These codes will be encrypted and securely stored. They will only be revealed to buyers after purchase."
              arrow
            >
              <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                <InfoOutlinedIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Box>
        </SectionTitle>

        {/* Add new code section */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.03), borderRadius: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Add a New Code
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Code"
                name="newCode"
                value={formData.newCode}
                onChange={handleCodeChange}
                placeholder={selectedPattern?.example || "Enter the exact code that buyers will receive"}
                error={Boolean(formErrors.newCode) || Boolean(validationError)}
                helperText={
                  formErrors.newCode || validationError ||
                  (selectedPattern ? `Format: ${selectedPattern.description || selectedPattern.regex}` : "The code your buyers will receive after purchase")
                }
                required
                size={isMobile ? "small" : "medium"}
                onKeyDown={handleCodeKeyDown}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CodeIcon />
                    </InputAdornment>
                  )
                }}
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
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Expiration Date (Optional)"
                  value={formData.newExpirationDate}
                  onChange={(date: Date | null) => {
                    if (handleDateChange) {
                      handleDateChange(date);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      helperText="Leave blank if the code doesn't expire"
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddCode}
                disabled={!formData.newCode.trim()}
                fullWidth
                sx={{ mt: 1 }}
              >
                Add Code
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Display added codes */}
        <Box sx={{ mb: 3 }}>
          <PaginatedCodesTable
            codes={formData.codes}
            onDeleteCode={(code) => handleDeleteCode && handleDeleteCode(code)}
          />

          {formErrors.codes && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formErrors.codes}
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
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
