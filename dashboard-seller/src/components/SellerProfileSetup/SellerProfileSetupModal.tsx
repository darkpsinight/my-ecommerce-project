import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  Grid,
  IconButton,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { SellerProfileData } from 'src/services/api/sellerProfile';
import ImageUpload from 'src/components/ImageUpload';
import { IMAGE_FOLDERS } from 'src/services/api/imageUpload';

interface SellerProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<SellerProfileData>) => Promise<boolean>;
  loading?: boolean;
}

interface SocialMediaLink {
  platform: string;
  url: string;
}

const steps = [
  {
    label: 'Basic Information',
    description: 'Set up your seller identity'
  },
  {
    label: 'Profile Images',
    description: 'Add your profile and banner images'
  },
  {
    label: 'Business Details',
    description: 'Optional company information'
  }
];

const SellerProfileSetupModal: React.FC<SellerProfileSetupModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [profileData, setProfileData] = useState<Partial<SellerProfileData>>({
    nickname: '',
    marketName: '',
    about: '',
    profileImageUrl: '',
    bannerImageUrl: '',
    enterpriseDetails: {
      companyName: '',
      website: '',
      socialMedia: []
    }
  });
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!profileData.nickname?.trim()) {
        newErrors.nickname = 'Seller nickname is required';
      }
      if (profileData.nickname && profileData.nickname.length > 50) {
        newErrors.nickname = 'Nickname must be 50 characters or less';
      }
      if (profileData.about && profileData.about.length > 500) {
        newErrors.about = 'About section must be 500 characters or less';
      }
    }

    if (step === 2) {
      if (profileData.enterpriseDetails?.website && !isValidUrl(profileData.enterpriseDetails.website)) {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('enterpriseDetails.')) {
      const subField = field.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        enterpriseDetails: {
          ...prev.enterpriseDetails,
          [subField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddSocialLink = () => {
    if (newSocialPlatform.trim() && newSocialUrl.trim() && isValidUrl(newSocialUrl)) {
      const newLink: SocialMediaLink = {
        platform: newSocialPlatform.trim(),
        url: newSocialUrl.trim()
      };
      setSocialLinks(prev => [...prev, newLink]);
      setNewSocialPlatform('');
      setNewSocialUrl('');
    }
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    const finalData: Partial<SellerProfileData> = {
      ...profileData,
      enterpriseDetails: {
        ...profileData.enterpriseDetails,
        socialMedia: socialLinks
      }
    };

    const success = await onSubmit(finalData);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setProfileData({
      nickname: '',
      marketName: '',
      about: '',
      profileImageUrl: '',
      bannerImageUrl: '',
      enterpriseDetails: {
        companyName: '',
        website: '',
        socialMedia: []
      }
    });
    setSocialLinks([]);
    setErrors({});
    onClose();
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Seller Nickname"
                  value={profileData.nickname || ''}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  error={!!errors.nickname}
                  helperText={errors.nickname || 'This is how buyers will see you'}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Market Name"
                  value={profileData.marketName || ''}
                  onChange={(e) => handleInputChange('marketName', e.target.value)}
                  helperText="Optional: Your store/shop name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="About You"
                  value={profileData.about || ''}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  error={!!errors.about}
                  helperText={errors.about || 'Tell buyers about yourself and what you sell'}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Profile Picture
                </Typography>
                <ImageUpload
                  value={profileData.profileImageUrl || ''}
                  onChange={(url) => handleInputChange('profileImageUrl', url)}
                  folder={IMAGE_FOLDERS.SELLER_PROFILE_IMAGES}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Banner Image
                </Typography>
                <ImageUpload
                  value={profileData.bannerImageUrl || ''}
                  onChange={(url) => handleInputChange('bannerImageUrl', url)}
                  folder={IMAGE_FOLDERS.SELLER_BANNER_IMAGES}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={profileData.enterpriseDetails?.companyName || ''}
                  onChange={(e) => handleInputChange('enterpriseDetails.companyName', e.target.value)}
                  helperText="Optional: Your company or business name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={profileData.enterpriseDetails?.website || ''}
                  onChange={(e) => handleInputChange('enterpriseDetails.website', e.target.value)}
                  error={!!errors.website}
                  helperText={errors.website || 'Optional: Your website URL'}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Social Media Links
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Platform"
                        value={newSocialPlatform}
                        onChange={(e) => setNewSocialPlatform(e.target.value)}
                        placeholder="e.g., Twitter, Discord"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="URL"
                        value={newSocialUrl}
                        onChange={(e) => setNewSocialUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <IconButton onClick={handleAddSocialLink} color="primary">
                        <AddIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {socialLinks.map((link, index) => (
                    <Chip
                      key={index}
                      label={`${link.platform}: ${link.url}`}
                      onDelete={() => handleRemoveSocialLink(index)}
                      deleteIcon={<DeleteIcon />}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StoreIcon color="primary" />
          <Typography variant="h4">
            Set Up Your Seller Profile
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Complete your seller profile to start selling on our marketplace. This helps buyers learn about you and builds trust.
        </Alert>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                {getStepContent(index)}
                <Box sx={{ mb: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                    sx={{ mr: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      index === steps.length - 1 ? 'Complete Setup' : 'Continue'
                    )}
                  </Button>
                  <Button
                    disabled={index === 0 || loading}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Skip for Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SellerProfileSetupModal;