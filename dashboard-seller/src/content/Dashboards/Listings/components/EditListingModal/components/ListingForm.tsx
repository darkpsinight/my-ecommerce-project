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
  styled,
  Stack,
  Alert,
  Card,
  CardContent,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fade,
  AlertTitle,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LanguageIcon from '@mui/icons-material/Language';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CodeIcon from '@mui/icons-material/Code';
import SellIcon from '@mui/icons-material/Sell';
import DescriptionIcon from '@mui/icons-material/Description';
import NotesIcon from '@mui/icons-material/Notes';
import SaveIcon from '@mui/icons-material/Save';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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
  section?: 'general' | 'codes' | 'tagsLanguages' | 'images';
  hideSubmitButton?: boolean;
  onCodesChange?: (codesCount: number) => void;
}

// Styled container for the Quill editor with improved styling
const EditorContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  '& .ql-container': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '0 0 8px 8px',
    background: theme.palette.background.paper,
    minHeight: '200px',
    fontFamily: theme.typography.fontFamily,
    fontSize: '1rem'
  },
  '& .ql-toolbar': {
    background: theme.palette.grey[50],
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: `8px 8px 0 0`,
    padding: '8px'
  },
  '& .ql-editor': {
    minHeight: '200px',
    padding: '16px'
  },
  // Error state styling
  '&.error .ql-container': {
    border: `1px solid ${theme.palette.error.main}`
  },
  '&.error .ql-toolbar': {
    borderColor: theme.palette.error.main
  },
  // Helper text styling
  '& .MuiFormHelperText-root': {
    marginLeft: '14px',
    marginTop: '4px',
    color: theme.palette.text.secondary,
    '&.Mui-error': {
      color: theme.palette.error.main
    }
  },
  // Placeholder styling
  '& .ql-editor.ql-blank::before': {
    color: theme.palette.text.secondary,
    fontStyle: 'normal',
    opacity: 0.7,
    padding: '0 16px'
  }
}));

// Improved code item styling
const CodeItem = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  transition: 'all 0.2s ease',
  '&.sold': {
    opacity: 0.7,
    backgroundColor: theme.palette.action.disabledBackground
  },
  '& .MuiCardContent-root': {
    padding: theme.spacing(1.5),
    '&:last-child': {
      paddingBottom: theme.spacing(1.5)
    }
  }
}));

// Section container with consistent styling
const SectionContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.primary.main,
    opacity: 0.7
  }
}));

// Custom section header with icon
const SectionHeader = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Box
      sx={{
        backgroundColor: 'primary.light',
        borderRadius: '50%',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 2,
        color: 'primary.main'
      }}
    >
      {icon}
    </Box>
    <Typography variant="h5" fontWeight="medium">
      {title}
    </Typography>
  </Box>
);

// Custom styled button for adding items
const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.primary.main,
  border: `1px dashed ${theme.palette.primary.main}`,
  '&:hover': {
    backgroundColor: theme.palette.grey[100]
  }
}));

// Form data interface
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
  codes:
    | Array<{ code: string; soldStatus: string; soldAt?: string | Date }>
    | undefined;
  newCode: string;
}

// Form errors interface
interface FormErrors {
  title: string;
  description: string;
  price: string;
  platform: string;
  region: string;
  thumbnailUrl: string;
  codes: string;
  newCode: string;
}

const ListingForm: FC<ListingFormProps> = ({
  listing,
  onSubmit,
  isSubmitting,
  section = 'general',
  hideSubmitButton = false,
  onCodesChange
}) => {
  const theme = useTheme();

  // Initialize form data from listing
  const [formData, setFormData] = useState<FormData>({
    title: listing.title || '',
    description: listing.description || '',
    price: listing.price?.toString() || '',
    originalPrice: listing.originalPrice?.toString() || '',
    platform: listing.platform || '',
    region: listing.region || '',
    isRegionLocked: listing.isRegionLocked || false,
    expirationDate: listing.expirationDate
      ? new Date(listing.expirationDate)
      : null,
    supportedLanguages: listing.supportedLanguages || [],
    thumbnailUrl: listing.thumbnailUrl || '',
    tags: listing.tags || [],
    status: listing.status || 'active',
    sellerNotes: listing.sellerNotes || '',
    codes: listing.codes || [],
    newCode: ''
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({
    title: '',
    description: '',
    price: '',
    platform: '',
    region: '',
    thumbnailUrl: '',
    codes: '',
    newCode: ''
  });

  // Available regions
  const regions = [
    'Global',
    'North America',
    'Europe',
    'Asia',
    'Oceania',
    'South America',
    'Africa'
  ];

  // Available platforms
  const platforms = [
    'Steam',
    'Epic Games',
    'Origin',
    'Uplay',
    'GOG',
    'PlayStation',
    'Xbox',
    'Nintendo',
    'Other'
  ];

  // Available statuses with color mapping
  const statuses = [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'draft', label: 'Draft', color: 'warning' }
  ];

  // Popular languages for autocomplete suggestions
  const commonLanguages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Chinese',
    'Russian',
    'Portuguese',
    'Italian',
    'Korean',
    'Arabic',
    'Dutch',
    'Swedish',
    'Polish'
  ];

  // Popular tags for autocomplete suggestions
  const suggestedTags = [
    'Action',
    'Adventure',
    'RPG',
    'Strategy',
    'Simulation',
    'Sports',
    'Racing',
    'Puzzle',
    'FPS',
    'MMORPG',
    'Indie',
    'Casual',
    'Multiplayer',
    'Co-op',
    'Single-player',
    'Open World',
    'VR',
    'Early Access',
    'Family Friendly',
    'Horror'
  ];

  // UI state
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formTouched, setFormTouched] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // Form steps definition
  const steps = [
    { label: 'Basic Information', icon: <DescriptionIcon /> },
    { label: 'Product Details', icon: <InfoOutlinedIcon /> },
    { label: 'Pricing', icon: <AttachMoneyIcon /> },
    { label: 'Tags & Languages', icon: <LocalOfferIcon /> },
    { label: 'Product Codes', icon: <CodeIcon /> },
    { label: 'Seller Notes', icon: <NotesIcon /> }
  ];

  // Handle text field input changes
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const target = e.target;
    const name = target.name as string;
    const value = target.value;

    setFormTouched(true);

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

    setFormTouched(true);
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
    setFormTouched(true);
    setFormData({
      ...formData,
      expirationDate: date
    });
  };

  // Custom handleChange for ReactQuill
  const handleDescriptionChange = (value: string) => {
    setFormTouched(true);
    setFormData({
      ...formData,
      description: value
    });

    // Clear error
    if (formErrors.description) {
      setFormErrors({
        ...formErrors,
        description: ''
      });
    }
  };

  // Handle code addition
  const handleAddCode = () => {
    if (!formData.newCode.trim()) {
      setFormErrors({
        ...formErrors,
        newCode: 'Please enter a code'
      });
      return;
    }

    // Check if code already exists
    if (formData.codes && formData.codes.some(c => c.code === formData.newCode.trim())) {
      setFormErrors({
        ...formErrors,
        newCode: 'This code already exists'
      });
      return;
    }

    const newCodes = [
      ...(formData.codes || []),
      {
        code: formData.newCode.trim(),
        soldStatus: 'active'
      }
    ];

    setFormData({
      ...formData,
      codes: newCodes,
      newCode: '' // Clear the input
    });

    // Clear any errors
    setFormErrors({
      ...formErrors,
      newCode: '',
      codes: ''
    });
    
    // Notify parent component about the code count change
    if (onCodesChange) {
      onCodesChange(newCodes.length);
    }
  };

  // Handle code deletion
  const handleDeleteCode = (codeToDelete: string) => {
    const updatedCodes = formData.codes?.filter(c => c.code !== codeToDelete) || [];
    
    setFormData({
      ...formData,
      codes: updatedCodes
    });
    
    // Notify parent component about the code count change
    if (onCodesChange) {
      onCodesChange(updatedCodes.length);
    }
  };

  // Keydown handler for code input
  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCode();
    }
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const errors: FormErrors = { ...formErrors };
    let isValid = true;

    // Validate based on active step
    switch (activeStep) {
      case 0: // Basic Information
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
        } else if (formData.description.replace(/<[^>]*>/g, '').length < 20) {
          errors.description = 'Description must be at least 20 characters';
          isValid = false;
        }

        // Thumbnail URL validation
        if (formData.thumbnailUrl && !isValidUrl(formData.thumbnailUrl)) {
          errors.thumbnailUrl = 'Please enter a valid URL';
          isValid = false;
        }
        break;

      case 1: // Product Details
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
        break;

      case 2: // Pricing
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

        // Original price validation
        if (formData.originalPrice) {
          const originalPrice = parseFloat(formData.originalPrice);
          const currentPrice = parseFloat(formData.price);

          if (isNaN(originalPrice) || originalPrice <= 0) {
            errors.price = 'Original price must be a positive number';
            isValid = false;
          } else if (originalPrice <= currentPrice) {
            errors.price = 'Original price should be higher than current price';
            isValid = false;
          }
        }
        break;

      case 4: // Product Codes
        // Codes validation
        if (!formData.codes || formData.codes.length === 0) {
          errors.codes = 'At least one product code is required';
          isValid = false;
        }
        break;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const errors: FormErrors = {
      title: '',
      description: '',
      price: '',
      platform: '',
      region: '',
      thumbnailUrl: '',
      codes: '',
      newCode: ''
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
    } else if (formData.description.replace(/<[^>]*>/g, '').length < 20) {
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

  // Handle navigation to next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCompletedSteps((prev) => [...prev, activeStep]);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // Handle navigation to previous step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      // Find the first step with errors and navigate to it
      if (
        formErrors.title ||
        formErrors.description ||
        formErrors.thumbnailUrl
      ) {
        setActiveStep(0);
      } else if (formErrors.platform || formErrors.region) {
        setActiveStep(1);
      } else if (formErrors.price) {
        setActiveStep(2);
      } else if (formErrors.codes) {
        setActiveStep(4);
      }
      return;
    }

    // Convert form data to listing format
    const updatedListing: Partial<Listing> = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice
        ? parseFloat(formData.originalPrice)
        : undefined,
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

  // Calculate discount percentage
  const getDiscountPercentage = (): string => {
    if (!formData.originalPrice || !formData.price) return '';

    const originalPrice = parseFloat(formData.originalPrice);
    const currentPrice = parseFloat(formData.price);

    if (
      isNaN(originalPrice) ||
      isNaN(currentPrice) ||
      originalPrice <= currentPrice
    )
      return '';

    const discount = Math.round(
      ((originalPrice - currentPrice) / originalPrice) * 100
    );
    return `${discount}% off`;
  };

  // Render different form sections based on the active tab
  const renderFormSection = () => {
    switch (section) {
      case 'general':
        return (
          <Box sx={{ pt: 1 }}>
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
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SellIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <EditorContainer
                  className={formErrors.description ? 'error' : ''}
                >
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    placeholder="Enter a detailed description of your listing..."
                  />
                  {formErrors.description && (
                    <FormHelperText className="Mui-error">
                      {formErrors.description}
                    </FormHelperText>
                  )}
                </EditorContainer>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price ($)"
                  name="price"
                  value={formData.price}
                  onChange={handleTextChange}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                  required
                  variant="outlined"
                  type="number"
                  inputProps={{ min: '0', step: '0.01' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Original Price ($)"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleTextChange}
                  variant="outlined"
                  type="number"
                  inputProps={{ min: '0', step: '0.01' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.platform} required>
                  <InputLabel id="platform-label">Platform</InputLabel>
                  <Select
                    labelId="platform-label"
                    name="platform"
                    value={formData.platform}
                    onChange={handleSelectChange}
                    label="Platform"
                  >
                    <MenuItem value="">Select Platform</MenuItem>
                    <MenuItem value="steam">Steam</MenuItem>
                    <MenuItem value="epic">Epic Games</MenuItem>
                    <MenuItem value="uplay">Ubisoft Connect</MenuItem>
                    <MenuItem value="origin">EA App / Origin</MenuItem>
                    <MenuItem value="gog">GOG</MenuItem>
                    <MenuItem value="battlenet">Battle.net</MenuItem>
                    <MenuItem value="microsoft">Microsoft Store</MenuItem>
                    <MenuItem value="playstation">PlayStation</MenuItem>
                    <MenuItem value="xbox">Xbox</MenuItem>
                    <MenuItem value="nintendo">Nintendo</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {formErrors.platform && (
                    <FormHelperText>{formErrors.platform}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.region}>
                  <InputLabel id="region-label">Region</InputLabel>
                  <Select
                    labelId="region-label"
                    name="region"
                    value={formData.region}
                    onChange={handleSelectChange}
                    label="Region"
                  >
                    <MenuItem value="">Select Region</MenuItem>
                    <MenuItem value="global">Global</MenuItem>
                    <MenuItem value="europe">Europe</MenuItem>
                    <MenuItem value="north_america">North America</MenuItem>
                    <MenuItem value="south_america">South America</MenuItem>
                    <MenuItem value="asia">Asia</MenuItem>
                    <MenuItem value="oceania">Oceania</MenuItem>
                    <MenuItem value="africa">Africa</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                  {formErrors.region && (
                    <FormHelperText>{formErrors.region}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRegionLocked}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isRegionLocked: e.target.checked
                        })
                      }
                      color="primary"
                    />
                  }
                  label="This product is region-locked"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    onChange={handleSelectChange}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Expiration Date (Optional)"
                    value={formData.expirationDate}
                    onChange={(newValue) => {
                      handleDateChange(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth variant="outlined" />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Seller Notes (Optional)"
                  name="sellerNotes"
                  value={formData.sellerNotes}
                  onChange={handleTextChange}
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Add any private notes about this listing (only visible to you)"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NotesIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              {!hideSubmitButton && (
                <Grid item xs={12}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 'codes':
        return (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>Manage Product Codes</AlertTitle>
                  Add, edit, or remove product codes for this listing. Each code
                  must follow the platform's format requirements.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'space-between',
                    flexDirection: { xs: 'column', sm: 'row' },
                    '& > *': { width: { xs: '100%', sm: 'auto' } }
                  }}
                >
                  <TextField
                    label="Add New Code"
                    sx={{ width: { xs: '100%', sm: '60%' } }}
                    name="newCode"
                    value={formData.newCode}
                    onChange={handleTextChange}
                    error={!!formErrors.newCode}
                    helperText={formErrors.newCode}
                    variant="outlined"
                    placeholder="Enter product code to add"
                    onKeyDown={handleCodeKeyDown}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CodeIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={{
                      width: { xs: '100%', sm: '35%' },
                      borderRadius: 2,
                      minWidth: '120px'
                    }}
                    color="primary"
                    onClick={handleAddCode}
                    disabled={!formData.newCode.trim()}
                    startIcon={<AddIcon />}
                  >
                    Add Code
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {formData.codes?.length || 0} Codes Added
                </Typography>

                <Box sx={{ maxHeight: '400px', overflow: 'auto', pr: 1 }}>
                  {formData.codes && formData.codes.length > 0 ? (
                    formData.codes.map((codeItem, index) => (
                      <CodeItem
                        key={index}
                        className={codeItem.soldStatus === 'sold' ? 'sold' : ''}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  wordBreak: 'break-all'
                                }}
                              >
                                {codeItem.code}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mt: 0.5
                                }}
                              >
                                <Chip
                                  label={
                                    codeItem.soldStatus === 'active'
                                      ? 'On Sale'
                                      : 'Sold'
                                  }
                                  size="small"
                                  color={
                                    codeItem.soldStatus === 'active'
                                      ? 'success'
                                      : 'default'
                                  }
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                {codeItem.soldStatus === 'sold' &&
                                  codeItem.soldAt && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ ml: 1 }}
                                    >
                                      Sold:{' '}
                                      {new Date(
                                        codeItem.soldAt
                                      ).toLocaleDateString()}
                                    </Typography>
                                  )}
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCode(codeItem.code)}
                              disabled={codeItem.soldStatus === 'sold'}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </CodeItem>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2, textAlign: 'center' }}
                    >
                      No codes added yet. Add your first code above.
                    </Typography>
                  )}
                </Box>
              </Grid>

              {!hideSubmitButton && (
                <Grid item xs={12}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 'tagsLanguages':
        return (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
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
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Add tags..."
                      helperText="Press Enter to add a new tag"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <LocalOfferIcon fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={[
                    'English',
                    'Spanish',
                    'French',
                    'German',
                    'Italian',
                    'Portuguese',
                    'Russian',
                    'Japanese',
                    'Chinese',
                    'Korean',
                    'Arabic',
                    'Polish',
                    'Dutch',
                    'Swedish',
                    'Turkish'
                  ]}
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
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        color="secondary"
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supported Languages"
                      placeholder="Select languages..."
                      helperText="Select all languages supported by this product"
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <LanguageIcon fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>

              {!hideSubmitButton && (
                <Grid item xs={12}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 'images':
        return (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>Manage Listing Images</AlertTitle>
                  Update the thumbnail image for your listing. A good image
                  helps your listing stand out.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Thumbnail URL"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleTextChange}
                  error={!!formErrors.thumbnailUrl}
                  helperText={
                    formErrors.thumbnailUrl ||
                    'URL to the main image for this listing'
                  }
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ImageIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              {formData.thumbnailUrl && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Current Thumbnail Preview
                    </Typography>
                    <Box
                      component="img"
                      src={formData.thumbnailUrl}
                      alt="Listing thumbnail"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: 1,
                        boxShadow: theme.shadows[1]
                      }}
                      onError={(e) => {
                        const width =
                          window.innerWidth > theme.breakpoints.values.md
                            ? 800
                            : window.innerWidth > theme.breakpoints.values.sm
                            ? 600
                            : 400;
                        if (e.currentTarget.src !== formData.thumbnailUrl) {
                          e.currentTarget.src = formData.thumbnailUrl;
                          return;
                        }
                        const svg = encodeURIComponent(`
                          <svg width="${width}" height="${Math.round(
                          width * 0.66
                        )}" 
                               xmlns="http://www.w3.org/2000/svg">
                            <rect width="100%" height="100%" fill="#e0e0e0"/>
                            <text x="50%" y="50%" dominant-baseline="middle" 
                                  text-anchor="middle" font-family="Arial" 
                                  font-size="20" fill="#666">
                              Thumbnail Preview
                            </text>
                          </svg>
                        `);
                        e.currentTarget.src = `data:image/svg+xml,${svg}`;
                      }}
                    />
                  </Box>
                </Grid>
              )}

              {!hideSubmitButton && (
                <Grid item xs={12}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return <Box>{renderFormSection()}</Box>;
};

export default ListingForm;
