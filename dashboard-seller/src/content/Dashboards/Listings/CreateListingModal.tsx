import { FC, useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Typography,
  FormHelperText,
  Box,
  Divider,
  InputAdornment,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getCategories, createListing, ListingData } from 'src/services/api/listings';
import { getValidationPatterns, Pattern } from 'src/services/api/validation';

interface Category {
  _id: string;
  name: string;
  description?: string;
  platforms?: Array<{
    name: string;
    description?: string;
    isActive?: boolean;
    patterns?: Array<{
      regex: string;
      description: string;
      example: string;
    }>;
  }>;
  isActive?: boolean;
}

interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (response: any) => void;
}

const CreateListingModal: FC<CreateListingModalProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [patternLoading, setPatternLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([
    'Global', 'North America', 'Europe', 'Asia', 'Oceania', 'South America', 'Africa', 'Other'
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ListingData>({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    categoryId: '',
    platform: '',
    region: 'Global',
    isRegionLocked: false,
    code: '',
    expirationDate: '',
    quantity: '1',
    supportedLanguages: [],
    thumbnailUrl: '',
    autoDelivery: true,
    tags: [],
    sellerNotes: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    platform: '',
    region: '',
    code: ''
  });

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setLoading(true);
        const response = await getCategories();
        if (response && response.success && response.data) {
          setCategories(response.data);
        } else {
          setError('Failed to load categories: ' + (response.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCategoriesData();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing category, update available platforms
    if (name === 'categoryId') {
      const category = categories.find(cat => cat._id === value);
      setSelectedCategory(category || null);
      
      if (category && category.platforms && category.platforms.length > 0) {
        // Extract platform names and filter active ones
        const platforms = category.platforms
          .filter(platform => platform.isActive !== false)
          .map(platform => platform.name);
        
        setAvailablePlatforms(platforms);
        
        // Reset platform selection if current selection isn't in the new list
        if (formData.platform && !platforms.includes(formData.platform as string)) {
          setFormData({
            ...formData,
            platform: '',
            [name]: value
          });
          // Reset patterns since platform changed
          setPatterns([]);
          setSelectedPattern(null);
          return;
        }
      } else {
        setAvailablePlatforms([]);
        // Reset platform selection since no platforms are available
        setFormData({
          ...formData,
          platform: '',
          [name]: value
        });
        // Reset patterns since category changed with no platforms
        setPatterns([]);
        setSelectedPattern(null);
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when field is being edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    // If platform changes, fetch validation patterns
    if (name === 'platform' && value && formData.categoryId) {
      fetchValidationPatterns(formData.categoryId as string, value as string);
    }
    
    // Clear validation error when code is edited
    if (name === 'code') {
      setValidationError(null);
    }
  };

  const validateForm = () => {
    const errors = {
      title: '',
      description: '',
      price: '',
      categoryId: '',
      platform: '',
      region: '',
      code: ''
    };
    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    }

    // Price validation
    if (!formData.price) {
      errors.price = 'Price is required';
      isValid = false;
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errors.price = 'Price must be a positive number';
      isValid = false;
    }

    // Category validation
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
      isValid = false;
    }

    // Platform validation
    if (!formData.platform) {
      errors.platform = 'Platform is required';
      isValid = false;
    }

    // Region validation
    if (!formData.region) {
      errors.region = 'Region is required';
      isValid = false;
    }

    // Code validation
    if (!formData.code.trim()) {
      errors.code = 'Product code is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Fetch validation patterns for the selected category and platform
  const fetchValidationPatterns = async (categoryId: string, platformName: string) => {
    try {
      setPatternLoading(true);
      
      const response = await getValidationPatterns(categoryId, platformName);
      
      if (response.success && response.data && response.data.patterns) {
        const activePatterns = response.data.patterns.filter(p => p.isActive !== false);
        setPatterns(activePatterns);
        
        // Use the first pattern by default
        if (activePatterns.length > 0) {
          setSelectedPattern(activePatterns[0]);
        } else {
          setSelectedPattern(null);
        }
      } else {
        setPatterns([]);
        setSelectedPattern(null);
      }
      
    } catch (error) {
      console.error('Error fetching validation patterns:', error);
      setPatterns([]);
      setSelectedPattern(null);
    } finally {
      setPatternLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price,
      originalPrice: formData.originalPrice ? (typeof formData.originalPrice === 'string' ? parseFloat(formData.originalPrice) : formData.originalPrice) : undefined,
      quantity: formData.quantity ? (typeof formData.quantity === 'string' ? parseInt(formData.quantity, 10) : formData.quantity) : 1
    };

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await createListing(submitData);
      
      if (response.success) {
        onSubmit(response);
      } else {
        // Check for code validation errors
        if (response.details && response.details.invalidPatterns) {
          const invalidPatternsInfo = response.details.invalidPatterns
            .map(pattern => pattern.description || pattern.regex)
            .join(', ');
          
          setValidationError(`Code doesn't match the required format: ${invalidPatternsInfo}`);
          
          setFormErrors({
            ...formErrors,
            code: `Invalid format for ${response.details.platform} on ${response.details.category}`
          });
        } else {
          setError(response.message || 'Failed to create listing. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Create New Listing</Typography>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Basic Information
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Steam Game Key for Cyberpunk 2077"
              error={!!formErrors.title}
              helperText={formErrors.title}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Thumbnail URL"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Detailed description of what this code unlocks, any restrictions, etc."
              error={!!formErrors.description}
              helperText={formErrors.description}
              required
            />
          </Grid>

          {/* Product Details */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Product Details
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!formErrors.categoryId} required>
              <InputLabel>Category</InputLabel>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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

          {/* Pricing */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Pricing
            </Typography>
          </Grid>
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

          {/* Product Code */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Product Code
              <Tooltip title="This code will be encrypted and securely stored. It will only be revealed to buyers after purchase." arrow>
                <IconButton size="small">
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder={selectedPattern?.example || "Enter the exact code that buyers will receive"}
              error={!!formErrors.code || !!validationError}
              helperText={
                formErrors.code || validationError || 
                (selectedPattern ? `Format: ${selectedPattern.description || selectedPattern.regex}` : undefined)
              }
              required
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
            />
          </Grid>
        </Grid>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" disabled={submitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={submitting || loading}
          startIcon={submitting && <CircularProgress size={20} color="inherit" />}
        >
          {submitting ? 'Creating...' : 'Create Listing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateListingModal;
