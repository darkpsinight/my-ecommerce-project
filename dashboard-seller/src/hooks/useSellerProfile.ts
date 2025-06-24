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
}

export const useSellerProfile = (): UseSellerProfileReturn => {
  const [profileData, setProfileData] = useState<SellerProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);

  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getSellerProfile();
      setProfileData(data);
      
      // Show profile setup if user doesn't have a profile
      if (!data.hasProfile && !showProfileSetup) {
        setShowProfileSetup(true);
      }
    } catch (err: any) {
      console.error('Error fetching seller profile:', err);
      setError(err.message || 'Failed to fetch seller profile');
      toast.error('Failed to load your seller profile');
    } finally {
      setLoading(false);
    }
  }, [showProfileSetup]);

  const updateProfile = useCallback(async (data: Partial<SellerProfileData>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedProfile = await updateSellerProfile(data);
      
      // Refresh the profile data after successful update
      await refreshProfile();
      
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
  }, [refreshProfile]);

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
    setShowProfileSetup
  };
};