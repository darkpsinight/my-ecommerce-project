import { useState, useEffect, useCallback } from 'react';
import { getSellerProfile, updateSellerProfile, SellerProfileResponse, SellerProfileData } from 'src/services/api/sellerProfile';
import toast from 'react-hot-toast';

interface UseSellerProfileReturn {
  profileData: SellerProfileResponse | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<SellerProfileData>) => Promise<boolean>;
  showProfileSetup: boolean;
  setShowProfileSetup: (show: boolean) => void;
  openProfileSetup: () => void;
}

export const useSellerProfile = (): UseSellerProfileReturn => {
  const [profileData, setProfileData] = useState<SellerProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getSellerProfile();
      setProfileData(data);
      
      // Only auto-show profile setup on initial load and if user hasn't dismissed it
      if (!data.hasProfile && isInitialLoad && !hasBeenDismissed) {
        setShowProfileSetup(true);
      }
      
      // Mark initial load as complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err: any) {
      console.error('Error fetching seller profile:', err);
      setError(err.message || 'Failed to fetch seller profile');
      toast.error('Failed to load your seller profile');
    } finally {
      setLoading(false);
    }
  }, [isInitialLoad, hasBeenDismissed]);

  const updateProfile = useCallback(async (data: Partial<SellerProfileData>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedProfile = await updateSellerProfile(data);
      
      // Update the profile data by merging with existing data
      if (profileData) {
        setProfileData({
          ...profileData,
          profile: updatedProfile,
          hasProfile: true
        });
      }
      
      toast.success('Seller profile updated successfully!');
      setShowProfileSetup(false);
      
      return true;
    } catch (err: any) {
      console.error('Error updating seller profile:', err);
      setError(err.message || 'Failed to update seller profile');
      toast.error(err.message || 'Failed to update seller profile');
      return false;
    } finally {
      setLoading(false);
    }
  }, [profileData]);

  // Function to explicitly open profile setup (e.g., when user clicks "Set Up Profile" button)
  const openProfileSetup = useCallback(() => {
    setHasBeenDismissed(false); // Reset dismissal state
    setShowProfileSetup(true);
  }, []);

  // Custom setShowProfileSetup that tracks dismissal
  const handleSetShowProfileSetup = useCallback((show: boolean) => {
    if (!show) {
      setHasBeenDismissed(true); // Mark as dismissed when closing
    }
    setShowProfileSetup(show);
  }, []);

  // Initial profile fetch
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return {
    profileData,
    loading,
    error,
    hasProfile: profileData?.hasProfile || false,
    refreshProfile,
    updateProfile,
    showProfileSetup,
    setShowProfileSetup: handleSetShowProfileSetup,
    openProfileSetup
  };
};