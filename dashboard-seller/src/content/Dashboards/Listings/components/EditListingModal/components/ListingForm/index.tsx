import { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  useTheme,
  SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CodeIcon from '@mui/icons-material/Code';
import NotesIcon from '@mui/icons-material/Notes';

// Import form sections
import BasicInformation from './sections/BasicInformation';
import Description from './sections/Description';
import Pricing from './sections/Pricing';
import TagsAndLanguages from './sections/TagsAndLanguages';
import ProductCodes from './sections/ProductCodes';
import SellerNotes from './sections/SellerNotes';
import ImageUpload from './sections/ImageUpload';

// Import types and utilities
import { FormData, FormErrors, FormRef, ListingFormProps, Listing } from './utils/types';
import { validateForm } from './utils/validation';
import { formSteps } from './utils/constants';

// Map of icon components for steps
const iconComponents = {
  description: <DescriptionIcon />,
  info: <InfoOutlinedIcon />,
  money: <AttachMoneyIcon />,
  tag: <LocalOfferIcon />,
  code: <CodeIcon />,
  notes: <NotesIcon />
};

/**
 * Main ListingForm component that integrates all form sections
 */
const ListingForm = forwardRef<FormRef, ListingFormProps>(
  ({
    listing,
    onSubmit,
    isSubmitting,
    section = 'general',
    hideSubmitButton = false,
    onCodesChange,
    categories = [],
    availablePlatforms = []
  }, 
  ref
) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  
  // Initialize form data from listing prop
  const [formData, setFormData] = useState<FormData>({
    title: listing.title || '',
    description: listing.description || '',
    price: listing.price ? listing.price.toString() : '',
    originalPrice: listing.originalPrice ? listing.originalPrice.toString() : '',
    platform: listing.platform || '',
    region: listing.region || '',
    isRegionLocked: listing.isRegionLocked || false,
    expirationDate: listing.expirationDate ? new Date(listing.expirationDate) : null,
    categoryId: listing.categoryId || '',
    status: listing.status || 'active',
    autoDelivery: listing.autoDelivery || false,
    thumbnailUrl: listing.thumbnailUrl || '',
    tags: listing.tags || [],
    supportedLanguages: listing.supportedLanguages || [],
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

  // UI state
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formTouched, setFormTouched] = useState(false);

  // Update parent component when codes change
  useEffect(() => {
    if (onCodesChange) {
      onCodesChange(formData.codes?.length || 0);
    }
  }, [formData.codes, onCodesChange]);

  /**
   * Handle text field input changes
   */
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
      setFormTouched(true);
    }
  };

  /**
   * Handle select input changes
   */
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormTouched(true);
  };

  /**
   * Handle date change
   */
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, expirationDate: date }));
    setFormTouched(true);
  };

  /**
   * Custom handleChange for ReactQuill description
   */
  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
    setFormTouched(true);
  };

  /**
   * Custom handleChange for ReactQuill seller notes
   */
  const handleSellerNotesChange = (value: string) => {
    setFormData(prev => ({ ...prev, sellerNotes: value }));
    setFormTouched(true);
  };

  /**
   * Handle code addition
   */
  const handleAddCode = () => {
    if (!formData.newCode.trim()) {
      setFormErrors(prev => ({ ...prev, newCode: 'Please enter a code' }));
      return;
    }

    // Check if code already exists
    if (formData.codes?.some(c => c.code === formData.newCode.trim())) {
      setFormErrors(prev => ({ ...prev, newCode: 'This code already exists' }));
      return;
    }

    // Add new code
    const updatedCodes = [
      ...(formData.codes || []),
      {
        code: formData.newCode.trim(),
        soldStatus: 'active'
      }
    ];

    setFormData(prev => ({
      ...prev,
      codes: updatedCodes,
      newCode: ''
    }));

    setFormErrors(prev => ({ ...prev, newCode: '', codes: '' }));
    setFormTouched(true);
  };

  /**
   * Handle code deletion
   */
  const handleDeleteCode = (codeToDelete: string) => {
    const updatedCodes = formData.codes?.filter(c => c.code !== codeToDelete) || [];
    setFormData(prev => ({
      ...prev,
      codes: updatedCodes
    }));
    setFormTouched(true);
  };

  /**
   * Keydown handler for code input
   */
  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCode();
    }
  };

  /**
   * Calculate discount percentage
   */
  const getDiscountPercentage = (): string => {
    if (!formData.originalPrice || !formData.price) return '0';
    
    const originalPrice = parseFloat(formData.originalPrice);
    const currentPrice = parseFloat(formData.price);
    
    if (isNaN(originalPrice) || isNaN(currentPrice) || originalPrice <= 0 || currentPrice <= 0) {
      return '0';
    }
    
    if (currentPrice >= originalPrice) {
      return '0';
    }
    
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return discount.toFixed(0);
  };

  /**
   * Handle navigation to next step
   */
  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  /**
   * Handle navigation to previous step
   */
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    const { errors, isValid } = validateForm(formData);
    
    if (!isValid) {
      setFormErrors(errors);
      return;
    }
    
    // Convert form data to listing data format
    const listingData = getFormDataForSubmit();
    
    // Submit the form
    onSubmit(listingData);
  };

  /**
   * Convert form data to listing data format for submission
   */
  const getFormDataForSubmit = (): Partial<Listing> => {
    // Convert form data to listing data format
    const listingData: Partial<Listing> = {};
    
    // Only include fields that are relevant to the current section
    if (section === 'general') {
      listingData.title = formData.title;
      listingData.description = formData.description;
      listingData.price = parseFloat(formData.price);
      if (formData.originalPrice) {
        listingData.originalPrice = parseFloat(formData.originalPrice);
      }
      listingData.platform = formData.platform;
      listingData.region = formData.region;
      listingData.isRegionLocked = formData.isRegionLocked;
      listingData.categoryId = formData.categoryId;
      listingData.autoDelivery = formData.autoDelivery;
    }
    
    if (section === 'codes') {
      listingData.codes = formData.codes;
      if (formData.expirationDate) {
        listingData.expirationDate = formData.expirationDate;
      }
      listingData.sellerNotes = formData.sellerNotes;
    }
    
    if (section === 'tagsLanguages') {
      listingData.tags = formData.tags;
      listingData.supportedLanguages = formData.supportedLanguages;
    }
    
    if (section === 'images') {
      listingData.thumbnailUrl = formData.thumbnailUrl;
    }
    
    return listingData;
  };

  /**
   * Render different form sections based on the active tab
   */
  const renderFormSection = () => {
    switch (section) {
      case 'general':
        return (
          <Box>
            <BasicInformation
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
              handleSelectChange={handleSelectChange}
              availablePlatforms={availablePlatforms}
            />
            
            <Description
              formData={formData}
              formErrors={formErrors}
              handleDescriptionChange={handleDescriptionChange}
            />
            
            <Pricing
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
              getDiscountPercentage={getDiscountPercentage}
            />
            
            {!hideSubmitButton && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
            )}
          </Box>
        );
        
      case 'codes':
        return (
          <Box>
            <ProductCodes
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
              handleDateChange={handleDateChange}
              handleAddCode={handleAddCode}
              handleDeleteCode={handleDeleteCode}
              handleCodeKeyDown={handleCodeKeyDown}
            />
            
            <SellerNotes
              formData={formData}
              handleSellerNotesChange={handleSellerNotesChange}
            />
            
            {!hideSubmitButton && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
            )}
          </Box>
        );
        
      case 'tagsLanguages':
        return (
          <Box>
            <TagsAndLanguages
              formData={formData}
              setFormData={setFormData}
            />
            
            {!hideSubmitButton && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
            )}
          </Box>
        );
        
      case 'images':
        return (
          <Box>
            <ImageUpload
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
            />
            
            {!hideSubmitButton && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    validateForm: () => {
      const { isValid } = validateForm(formData);
      return isValid;
    },
    getFormData: () => {
      // Convert form data to listing data format
      const listingData: Partial<Listing> = {};
      
      // Only include fields that are relevant to the current section
      if (section === 'general') {
        listingData.title = formData.title;
        listingData.description = formData.description;
        listingData.price = parseFloat(formData.price);
        if (formData.originalPrice) {
          listingData.originalPrice = parseFloat(formData.originalPrice);
        }
        listingData.platform = formData.platform;
        listingData.region = formData.region;
        listingData.isRegionLocked = formData.isRegionLocked;
        listingData.categoryId = formData.categoryId;
        listingData.autoDelivery = formData.autoDelivery;
      }
      
      if (section === 'codes') {
        listingData.codes = formData.codes;
        if (formData.expirationDate) {
          listingData.expirationDate = formData.expirationDate;
        }
        listingData.sellerNotes = formData.sellerNotes;
      }
      
      if (section === 'tagsLanguages') {
        listingData.tags = formData.tags;
        listingData.supportedLanguages = formData.supportedLanguages;
      }
      
      if (section === 'images') {
        listingData.thumbnailUrl = formData.thumbnailUrl;
      }
      
      return listingData;
    }
  }));

  return <Box>{renderFormSection()}</Box>;
});

export default ListingForm;
