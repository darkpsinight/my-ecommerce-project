import { FC, useState, useEffect, useRef } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Button,
  Box,
  Divider,
  Typography,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  SelectChangeEvent,
  Tooltip,
  IconButton,
  Autocomplete,
  styled
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Listing } from '../../../types';

interface ListingFormProps {
  listing: Listing;
  onSubmit: (updatedListing: Partial<Listing>) => void;
  isSubmitting: boolean;
}

/**
 * Styled container for the Quill editor to match Material-UI theme
 */
const EditorContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  '& .ql-container': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '0 0 4px 4px',
    background: theme.palette.background.paper,
    minHeight: '150px',
    fontFamily: theme.typography.fontFamily,
  },
  '& .ql-toolbar': {
    background: theme.palette.grey[100],
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  },
  // Error state styling
  '&.error .ql-container': {
    border: `1px solid ${theme.palette.error.main}`,
  },
  '&.error .ql-toolbar': {
    borderColor: theme.palette.error.main,
  },
  // Helper text styling
  '& .MuiFormHelperText-root': {
    marginLeft: '14px',
    marginTop: '4px',
    color: theme.palette.text.secondary,
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  // Placeholder styling
  '& .ql-editor.ql-blank::before': {
    color: theme.palette.text.secondary,
    fontStyle: 'normal',
    opacity: 0.7,
  }
}));

const CodeItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.sold': {
    opacity: 0.7,
    backgroundColor: theme.palette.action.disabledBackground,
  }
}));

interface FormData {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  platform: string;
  region: string;
  isRegionLocked: boolean;
  expirationDate: Date | null;
  supportedLanguages: string[];
  thumbnailUrl: string;
  tags: string[];
  status: string;
  sellerNotes: string;
  codes: Array<{ code: string; soldStatus: string; soldAt?: string | Date }> | undefined;
}

interface FormErrors {
  title: string;
  description: string;
  price: string;
  platform: string;
  region: string;
  thumbnailUrl: string;
  codes: string;
}

const ListingForm: FC<ListingFormProps> = ({
  listing,
  onSubmit,
  isSubmitting
}) => {
  // Initialize form data from listing
  const [formData, setFormData] = useState<FormData>({
    title: listing.title || '',
    description: listing.description || '',
    price: listing.price?.toString() || '',
    originalPrice: listing.originalPrice?.toString() || '',
    platform: listing.platform || '',
    region: listing.region || '',
    isRegionLocked: listing.isRegionLocked || false,
    expirationDate: listing.expirationDate ? new Date(listing.expirationDate) : null,
    supportedLanguages: listing.supportedLanguages || [],
    thumbnailUrl: listing.thumbnailUrl || '',
    tags: listing.tags || [],
    status: listing.status || 'active',
    sellerNotes: listing.sellerNotes || '',
    codes: listing.codes || []
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({
    title: '',
    description: '',
    price: '',
    platform: '',
    region: '',
    thumbnailUrl: '',
    codes: ''
  });

  // New tag input
  const [newTag, setNewTag] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  
  // Quill editor reference
  const quillRef = useRef<ReactQuill>(null);

  // Available regions (would typically come from an API)
  const regions = ['Global', 'North America', 'Europe', 'Asia', 'Oceania', 'South America', 'Africa'];
  
  // Available platforms (would typically come from an API)
  const platforms = ['Steam', 'Epic Games', 'Origin', 'Uplay', 'GOG', 'PlayStation', 'Xbox', 'Nintendo', 'Other'];
  
  // Available statuses
  const statuses = ['active', 'draft', 'paused'];

  // Handle text field input changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const target = e.target;
    const name = target.name as string;
    const value = target.value;
    
    // Handle checkbox separately
    if ('checked' in target && target.type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is edited
    if (name && name in formErrors) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle select input changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (name && name in formErrors) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      expirationDate: date
    });
  };

  // Custom handleChange for ReactQuill to mimic TextField's onChange
  const handleDescriptionChange = (value: string) => {
    const syntheticEvent = {
      target: {
        name: 'description',
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleTextChange(syntheticEvent);
  };

  // Handle code deletion
  const handleDeleteCode = (codeToDelete: string) => {
    if (!formData.codes) return;
    
    const updatedCodes = formData.codes.filter(code => code.code !== codeToDelete);
    setFormData({
      ...formData,
      codes: updatedCodes
    });
  };

  // Add a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Add a new language
  const handleAddLanguage = () => {
    if (newLanguage.trim() && !formData.supportedLanguages.includes(newLanguage.trim())) {
      setFormData({
        ...formData,
        supportedLanguages: [...formData.supportedLanguages, newLanguage.trim()]
      });
      setNewLanguage('');
    }
  };

  // Remove a language
  const handleRemoveLanguage = (langToRemove: string) => {
    setFormData({
      ...formData,
      supportedLanguages: formData.supportedLanguages.filter(lang => lang !== langToRemove)
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {
      title: '',
      description: '',
      price: '',
      platform: '',
      region: '',
      thumbnailUrl: '',
      codes: ''
    };
    
    let isValid = true;
    
    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
      isValid = false;
    }
    
    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
      isValid = false;
    }
    
    // Price validation
    if (!formData.price.trim()) {
      errors.price = 'Price is required';
      isValid = false;
    } else {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        errors.price = 'Price must be a positive number';
        isValid = false;
      }
    }
    
    // Platform validation
    if (!formData.platform) {
      errors.platform = 'Platform is required';
      isValid = false;
    }
    
    // Region validation
    if (formData.isRegionLocked && !formData.region) {
      errors.region = 'Region is required when region-locked';
      isValid = false;
    }
    
    // Thumbnail URL validation
    if (formData.thumbnailUrl && !isValidUrl(formData.thumbnailUrl)) {
      errors.thumbnailUrl = 'Please enter a valid URL';
      isValid = false;
    }
    
    // Codes validation
    if (!formData.codes || formData.codes.length === 0) {
      errors.codes = 'At least one product code is required';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  // Check if URL is valid
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Convert form data to listing format
    const updatedListing: Partial<Listing> = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      platform: formData.platform,
      region: formData.isRegionLocked ? formData.region : undefined,
      isRegionLocked: formData.isRegionLocked,
      expirationDate: formData.expirationDate,
      supportedLanguages: formData.supportedLanguages,
      thumbnailUrl: formData.thumbnailUrl,
      tags: formData.tags,
      status: formData.status as any,
      sellerNotes: formData.sellerNotes,
      codes: formData.codes
    };
    
    onSubmit(updatedListing);
  };

  return (
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleTextChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Description <span style={{ color: 'red' }}>*</span>
                </Typography>
                <EditorContainer className={formErrors.description ? 'error' : ''}>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image'],
                        ['clean'],
                      ],
                    }}
                    style={{ minHeight: '200px' }}
                    placeholder="Provide a detailed description of your product. Include important features, usage instructions, and any other information buyers should know. For digital products, specify platform compatibility, activation instructions, and any expiration details."
                  />
                  {formErrors.description && (
                    <div className="MuiFormHelperText-root Mui-error" style={{ fontWeight: 'bold' }}>
                      {formErrors.description}
                    </div>
                  )}
                </EditorContainer>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Thumbnail URL"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleTextChange}
                  error={!!formErrors.thumbnailUrl}
                  helperText={formErrors.thumbnailUrl || 'Enter a URL for the product image'}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Product Details */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Product Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.platform} required>
                  <InputLabel>Platform</InputLabel>
                  <Select
                    name="platform"
                    value={formData.platform}
                    onChange={handleSelectChange}
                    label="Platform"
                  >
                    {platforms.map((platform) => (
                      <MenuItem key={platform} value={platform}>
                        {platform}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.platform && <FormHelperText>{formErrors.platform}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRegionLocked}
                      onChange={handleTextChange}
                      name="isRegionLocked"
                      color="primary"
                    />
                  }
                  label="Region Locked"
                />
              </Grid>
              
              {formData.isRegionLocked && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!formErrors.region} required>
                    <InputLabel>Region</InputLabel>
                    <Select
                      name="region"
                      value={formData.region}
                      onChange={handleSelectChange}
                      label="Region"
                    >
                      {regions.map((region) => (
                        <MenuItem key={region} value={region}>
                          {region}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.region && <FormHelperText>{formErrors.region}</FormHelperText>}
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Status"
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Expiration Date"
                    value={formData.expirationDate}
                    onChange={handleDateChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText="When the product codes expire (optional)"
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              

            </Grid>
          </Paper>
        </Grid>
        
        {/* Pricing */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Pricing
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  value={formData.price}
                  onChange={handleTextChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Original Price (before discount)"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleTextChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Leave empty if there's no discount"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Tags and Languages */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Tags and Languages
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete<string, true, undefined, true>
                  multiple
                  freeSolo
                  options={[]}
                  value={formData.tags}
                  onChange={(event, newValue: string[]) => {
                    setFormData({
                      ...formData,
                      tags: newValue
                    });
                  }}
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
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete<string, true, undefined, true>
                  multiple
                  freeSolo
                  options={[]}
                  value={formData.supportedLanguages}
                  onChange={(event, newValue: string[]) => {
                    setFormData({
                      ...formData,
                      supportedLanguages: newValue
                    });
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip 
                        key={`lang-${option}-${index}`}
                        variant="outlined" 
                        label={option} 
                        size="small"
                        color="secondary"
                        {...getTagProps({ index })} 
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      label="Supported Languages (Optional)"
                      placeholder="Add languages and press Enter"
                      helperText="Languages supported by this product"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Product Codes */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Product Codes
              <Tooltip 
                title="These codes will be delivered to buyers after purchase. You can manage them here." 
                arrow
              >
                <IconButton size="small" sx={{ p: 0 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {formErrors.codes && (
                  <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {formErrors.codes}
                  </Typography>
                )}
                
                {formData.codes && formData.codes.length > 0 ? (
                  <Box sx={{ mb: 2 }}>
                    {formData.codes.map((code, index) => (
                      <CodeItem 
                        key={`code-${index}`}
                        className={code.soldStatus !== 'active' ? 'sold' : ''}
                      >
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {code.code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Status: {code.soldStatus.charAt(0).toUpperCase() + code.soldStatus.slice(1)}
                            {code.soldAt && ` • Sold: ${new Date(code.soldAt).toLocaleDateString()}`}
                          </Typography>
                        </Box>
                        {code.soldStatus === 'active' && (
                          <IconButton 
                            color="error" 
                            size="small" 
                            onClick={() => handleDeleteCode(code.code)}
                            title="Delete code"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </CodeItem>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No product codes available. Please add at least one code.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Seller Notes */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Seller Notes (Private)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Private Notes"
                  name="sellerNotes"
                  value={formData.sellerNotes}
                  onChange={handleTextChange}
                  multiline
                  rows={3}
                  placeholder="Add private notes about this listing (not visible to buyers)"
                  helperText="These notes are only visible to you and will not be shown to buyers"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Submit Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
              size="large"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>
  );
};

export default ListingForm;
