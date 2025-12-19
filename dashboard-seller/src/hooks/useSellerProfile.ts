import { useState, useEffect, useCallback } from 'react';
import { getSellerProfile, updateSellerProfile, SellerProfileResponse, SellerProfileData } from 'src/services/api/sellerProfile';
import { getStripeAccountStatus } from 'src/services/api/payment';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Global cache to prevent multiple API calls
let globalProfileCache: {
  data: SellerProfileResponse | null;
  loading: boolean;
  error: string | null;
  lastFetch: number;
} = {
  data: null,
  loading: false,
  error: null,
  lastFetch: 0
};

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

interface FinancialSetupData {
  hasStripeAccount: boolean;
  stripeAccountStatus: 'pending' | 'verified' | 'requires_action' | null;
  canReceivePayments: boolean;
  pendingRequirements?: string[];
}

interface UseSellerProfileReturn {
  profileData: SellerProfileResponse | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
  refreshProfile: (forceRefresh?: boolean) => Promise<void>;
  updateProfile: (data: Partial<SellerProfileData>) => Promise<boolean>;
  showProfileSetup: boolean;
  setShowProfileSetup: (show: boolean) => void;
  openProfileSetup: () => void;
  // Financial onboarding state
  financialData: FinancialSetupData | null;
  showFinancialSetup: boolean;
  setShowFinancialSetup: (show: boolean) => void;
  openFinancialSetup: () => void;
  needsFinancialSetup: boolean;
  completeProfileAndShowFinancial: () => void;
}

export const useSellerProfile = (): UseSellerProfileReturn => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<SellerProfileResponse | null>(globalProfileCache.data);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(globalProfileCache.error);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Financial onboarding state
  const [financialData, setFinancialData] = useState<FinancialSetupData | null>(null);
  const [showFinancialSetup, setShowFinancialSetup] = useState<boolean>(false);
  const [hasFinancialBeenDismissed, setHasFinancialBeenDismissed] = useState<boolean>(false);

  const refreshProfile = useCallback(async (forceRefresh: boolean = false) => {
    const now = Date.now();
    const isCacheValid = globalProfileCache.data && (now - globalProfileCache.lastFetch) < CACHE_DURATION;

    // Use cache if valid and not forcing refresh
    if (isCacheValid && !forceRefresh) {
      setProfileData(globalProfileCache.data);
      setError(globalProfileCache.error);
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous API calls
    if (globalProfileCache.loading && !forceRefresh) {
      return;
    }

    try {
      globalProfileCache.loading = true;
      setLoading(true);
      setError(null);

      const data = await getSellerProfile();

      // Update global cache
      globalProfileCache.data = data;
      globalProfileCache.error = null;
      globalProfileCache.lastFetch = now;

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
      const errorMessage = err.message || 'Failed to fetch seller profile';

      // Update global cache
      globalProfileCache.error = errorMessage;

      setError(errorMessage);
      toast.error('Failed to load your seller profile');
    } finally {
      globalProfileCache.loading = false;
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
        const newProfileData = {
          ...profileData,
          profile: updatedProfile,
          hasProfile: true
        };

        // Update local state
        setProfileData(newProfileData);

        // Update global cache
        globalProfileCache.data = newProfileData;
        globalProfileCache.lastFetch = Date.now();
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

  // Function to handle profile completion and show financial setup
  const completeProfileAndShowFinancial = useCallback(() => {
    setShowProfileSetup(false);

    // Check if financial setup is needed
    if (!financialData?.canReceivePayments) {
      setShowFinancialSetup(true);
    }
  }, [financialData]);

  // Financial setup functions
  const openFinancialSetup = useCallback(() => {
    setHasFinancialBeenDismissed(false);
    setShowFinancialSetup(true);
  }, []);

  const handleSetShowFinancialSetup = useCallback((show: boolean) => {
    if (!show) {
      setHasFinancialBeenDismissed(true);
    }
    setShowFinancialSetup(show);
  }, []);

  // Fetch financial data from API
  const fetchFinancialData = useCallback(async () => {
    try {
      // Get the actual Stripe account status from the backend
      const stripeStatus = await getStripeAccountStatus();

      const newFinancialData: FinancialSetupData = {
        hasStripeAccount: stripeStatus.hasAccount,
        stripeAccountStatus: stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled ? 'verified' :
          stripeStatus.requirements?.currently_due?.length > 0 ? 'requires_action' :
            stripeStatus.hasAccount ? 'pending' : null,
        canReceivePayments: stripeStatus.chargesEnabled === true && stripeStatus.payoutsEnabled === true,
        pendingRequirements: stripeStatus.requirements?.currently_due || []
      };

      setFinancialData(newFinancialData);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      // Fallback to empty state on error, don't use mock data
      setFinancialData({
        hasStripeAccount: false,
        stripeAccountStatus: null,
        canReceivePayments: false,
        pendingRequirements: []
      });
    }
  }, []);

  // Load financial data when profile is loaded
  useEffect(() => {
    if (profileData?.hasProfile) {
      fetchFinancialData();
    }
  }, [profileData, fetchFinancialData]);

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

  // Computed properties
  const needsFinancialSetup = profileData?.hasProfile && !financialData?.canReceivePayments;

  return {
    profileData,
    loading,
    error,
    hasProfile: profileData?.hasProfile || false,
    refreshProfile,
    updateProfile,
    showProfileSetup,
    setShowProfileSetup: handleSetShowProfileSetup,
    openProfileSetup,
    // Financial onboarding
    financialData,
    showFinancialSetup,
    setShowFinancialSetup: handleSetShowFinancialSetup,
    openFinancialSetup,
    needsFinancialSetup: needsFinancialSetup || false,
    completeProfileAndShowFinancial
  };
};