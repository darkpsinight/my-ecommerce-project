import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Store as StoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { SellerProfileResponse } from 'src/services/api/sellerProfile';

interface ProfileStatusBannerProps {
  profileData: SellerProfileResponse | null;
  loading: boolean;
  onSetupProfile: () => void;
}

const ProfileStatusBanner: React.FC<ProfileStatusBannerProps> = ({
  profileData,
  loading,
  onSetupProfile
}) => {
  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="info">
          <AlertTitle>Loading your profile...</AlertTitle>
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="error">
          <AlertTitle>Unable to load profile</AlertTitle>
          <Typography variant="body2">
            There was an issue loading your seller profile. Please try refreshing the page.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!profileData.hasProfile) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="warning" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<StoreIcon />}
              onClick={onSetupProfile}
              variant="outlined"
            >
              Set Up Profile
            </Button>
          }
        >
          <AlertTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon />
              Complete Your Seller Profile
            </Box>
          </AlertTitle>
          <Typography variant="body2">
            Welcome to the seller dashboard! To start selling, please complete your seller profile. 
            This helps buyers learn about you and builds trust in your listings.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Profile exists - show completion status
  const profile = profileData.profile!;
  const completionItems = [
    { key: 'nickname', label: 'Seller Name', completed: !!profile.nickname },
    { key: 'about', label: 'About Section', completed: !!profile.about },
    { key: 'profileImage', label: 'Profile Picture', completed: !!profile.profileImageUrl },
    { key: 'bannerImage', label: 'Banner Image', completed: !!profile.bannerImageUrl },
    { key: 'marketName', label: 'Market Name', completed: !!profile.marketName },
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  if (completionPercentage === 100) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="success">
          <AlertTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon />
              Profile Complete!
            </Box>
          </AlertTitle>
          <Typography variant="body2">
            Great job! Your seller profile is complete. Buyers can now learn about you and your business.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Alert 
        severity="info"
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={onSetupProfile}
            variant="outlined"
          >
            Complete Profile
          </Button>
        }
      >
        <AlertTitle>Profile Status: {completionPercentage}% Complete</AlertTitle>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Your seller profile is partially complete. Consider adding the missing information to improve buyer trust.
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {completionItems.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              color={item.completed ? 'success' : 'default'}
              variant={item.completed ? 'filled' : 'outlined'}
              size="small"
              icon={item.completed ? <CheckCircleIcon /> : undefined}
            />
          ))}
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={completionPercentage} 
          sx={{ mt: 2 }}
        />
      </Alert>
    </Box>
  );
};

export default ProfileStatusBanner;