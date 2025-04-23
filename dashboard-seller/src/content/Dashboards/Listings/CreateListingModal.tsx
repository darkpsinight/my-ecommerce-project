import { FC, useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  IconButton,
  Typography,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  getCategories,
  createListing,
  ListingData
} from 'src/services/api/listings';
import { getValidationPatterns, Pattern } from 'src/services/api/validation';
import {
  BasicInformation,
  ProductDetails,
  Pricing,
  ProductCode,
  validateListingForm,
  ListingFormData,
  ListingFormErrors
} from './components';

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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [patternLoading, setPatternLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([
    'Global',
    'North America',
    'Europe',
    'Asia',
    'Oceania',
    'South America',
    'Africa',
    'Other'
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ListingFormData>({
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
  const [formErrors, setFormErrors] = useState<ListingFormErrors>({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    platform: '',
    region: '',
    code: ''
  });

  const bottomErrorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (error && bottomErrorRef.current) {
      bottomErrorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [error]);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setLoading(true);
        const response = await getCategories();
        if (response && response.success && response.data) {
          setCategories(response.data);
        } else {
          setError(
            'Failed to load categories: ' +
              (response.message || 'Unknown error')
          );
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
      const category = categories.find((cat) => cat._id === value);
      setSelectedCategory(category || null);

      if (category && category.platforms && category.platforms.length > 0) {
        // Extract platform names and filter active ones
        const platforms = category.platforms
          .filter((platform) => platform.isActive !== false)
          .map((platform) => platform.name);

        setAvailablePlatforms(platforms);

        // Reset platform selection if current selection isn't in the new list
        if (
          formData.platform &&
          !platforms.includes(formData.platform as string)
        ) {
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

      // Validate code against regex pattern in real-time
      if (selectedPattern && value) {
        try {
          const regex = new RegExp(selectedPattern.regex);
          const isValid = regex.test(value);

          if (!isValid) {
            setValidationError(
              `Code doesn't match the required format: ${
                selectedPattern.description || selectedPattern.regex
              }`
            );
          }
        } catch (error) {
          console.error('Invalid regex pattern:', error);
        }
      }
    }
  };

  const validateForm = () => {
    const { errors, isValid } = validateListingForm(formData);
    setFormErrors(errors);
    return isValid;
  };

  // Fetch validation patterns for the selected category and platform
  const fetchValidationPatterns = async (
    categoryId: string,
    platformName: string
  ) => {
    try {
      setPatternLoading(true);

      const response = await getValidationPatterns(categoryId, platformName);

      if (response.success && response.data && response.data.patterns) {
        const activePatterns = response.data.patterns.filter(
          (p) => p.isActive !== false
        );
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
      price:
        typeof formData.price === 'string'
          ? parseFloat(formData.price)
          : formData.price,
      originalPrice: formData.originalPrice
        ? typeof formData.originalPrice === 'string'
          ? parseFloat(formData.originalPrice)
          : formData.originalPrice
        : undefined,
      quantity: formData.quantity
        ? typeof formData.quantity === 'string'
          ? parseInt(formData.quantity, 10)
          : formData.quantity
        : 1,
      expirationDate:
        formData.expirationDate && formData.expirationDate.trim() !== ''
          ? formData.expirationDate
          : undefined
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
            .map((pattern) => pattern.description || pattern.regex)
            .join(', ');

          setValidationError(
            `Code doesn't match the required format: ${invalidPatternsInfo}`
          );

          setFormErrors({
            ...formErrors,
            code: `Invalid format for ${response.details.platform} on ${response.details.category}`
          });
        } else {
          setError(
            response.message || 'Failed to create listing. Please try again.'
          );
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
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h4">Create New Listing</Typography>
        <IconButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {error && <div style={{ minHeight: 0 }} />}
        <Grid container spacing={3}>
          {/* Basic Information */}
          <BasicInformation
            formData={{
              title: formData.title,
              thumbnailUrl: formData.thumbnailUrl,
              description: formData.description
            }}
            formErrors={{
              title: formErrors.title,
              description: formErrors.description
            }}
            handleChange={handleChange}
          />

          {/* Product Details */}
          <ProductDetails
            formData={{
              categoryId: formData.categoryId,
              platform: formData.platform,
              region: formData.region,
              quantity: formData.quantity
            }}
            formErrors={{
              categoryId: formErrors.categoryId,
              platform: formErrors.platform,
              region: formErrors.region
            }}
            handleChange={handleChange}
            categories={categories}
            availablePlatforms={availablePlatforms}
            regions={regions}
          />

          {/* Pricing */}
          <Pricing
            formData={{
              price: formData.price,
              originalPrice: formData.originalPrice
            }}
            formErrors={{
              price: formErrors.price
            }}
            handleChange={handleChange}
          />

          {/* Product Code */}
          <ProductCode
            formData={{
              code: formData.code,
              expirationDate: formData.expirationDate,
              sellerNotes: formData.sellerNotes
            }}
            formErrors={{
              code: formErrors.code
            }}
            handleChange={handleChange}
            selectedPattern={selectedPattern}
            validationError={validationError}
          />

          {/* Error Alert moved below seller notes */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mt: 2 }} ref={bottomErrorRef}>
                {error}
              </Alert>
            </Grid>
          )}
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
          startIcon={
            submitting && <CircularProgress size={20} color="inherit" />
          }
        >
          {submitting ? 'Creating...' : 'Create Listing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateListingModal;
