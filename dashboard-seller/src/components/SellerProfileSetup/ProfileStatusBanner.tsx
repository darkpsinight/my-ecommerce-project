import React, { useState, useEffect } from 'react';
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
  const [showCompletionMessage, setShowCompletionMessage] = useState(true);
  const [hasShownCompletionBefore, setHasShownCompletionBefore] = useState(false);

  // LocalStorage key for tracking completion message display
  const COMPLETION_MESSAGE_KEY = 'seller-profile-completion-shown';

  // Check if completion message has been shown before
  useEffect(() => {
    const hasShown = localStorage.getItem(COMPLETION_MESSAGE_KEY);
    if (hasShown === 'true') {
      setHasShownCompletionBefore(true);
      setShowCompletionMessage(false);
    }
  }, []);

  // Mark completion message as shown when profile is complete
  useEffect(() => {
    if (profileData?.profile && !loading) {
      const profile = profileData.profile;
      const completionItems = [
        { key: 'nickname', completed: !!profile.nickname },
        { key: 'about', completed: !!profile.about },
        { key: 'profileImage', completed: !!profile.profileImageUrl },
        { key: 'bannerImage', completed: !!profile.bannerImageUrl },
        { key: 'marketName', completed: !!profile.marketName },
      ];

      const completedCount = completionItems.filter(item => item.completed).length;
      const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

      // If profile is 100% complete and user hasn't seen the message before, show it
      if (completionPercentage === 100 && !hasShownCompletionBefore) {
        setShowCompletionMessage(true);
        // Mark as shown in localStorage
        localStorage.setItem(COMPLETION_MESSAGE_KEY, 'true');
        setHasShownCompletionBefore(true);
      }
    }
  }, [profileData, loading, hasShownCompletionBefore]);

  // Function to dismiss the completion message
  const handleDismissCompletion = () => {
    setShowCompletionMessage(false);
  };

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
    // Only show the completion message if it should be displayed
    if (showCompletionMessage) {
      return (
        <Box sx={{ mb: 3 }}>
          <Alert 
            severity="success"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleDismissCompletion}
                variant="outlined"
              >
                Dismiss
              </Button>
            }
          >
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
    } else {
      // If completion message is dismissed, don't show any banner
      return null;
    }
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