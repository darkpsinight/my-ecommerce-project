import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getSellerProfile, updateSellerProfile, SellerProfileData, SellerProfileResponse } from 'src/services/api/sellerProfile';
import { toast } from 'react-hot-toast';

interface SellerProfileState {
  loading: boolean;
  error: string | null;
  userData: {
    name: string;
    email: string;
    role: string;
  } | null;
  profileData: SellerProfileData | null;
  hasProfile: boolean;
}

const initialState: SellerProfileState = {
  loading: false,
  error: null,
  userData: null,
  profileData: null,
  hasProfile: false
};

// Async thunk for fetching seller profile
export const fetchSellerProfile = createAsyncThunk(
  'sellerProfile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getSellerProfile();
      return response;
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch profile');
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

// Async thunk for updating seller profile
export const updateProfile = createAsyncThunk(
  'sellerProfile/updateProfile',
  async (profileData: Partial<SellerProfileData>, { rejectWithValue, getState }) => {
    try {
      console.log('updateProfile thunk called with data:', profileData);

      // Get current profile data from state
      const state = getState() as { sellerProfile: SellerProfileState };
      const currentProfile = state.sellerProfile.profileData;

      console.log('Current profile from state:', currentProfile);

      // Always include the required nickname field
      const updatedData: Partial<SellerProfileData> = {
        ...profileData
      };

      // If nickname is not provided in the update data
      if (!updatedData.nickname) {
        // Use the existing nickname if available
        if (currentProfile && currentProfile.nickname) {
          updatedData.nickname = currentProfile.nickname;
          console.log('Using existing nickname from state:', updatedData.nickname);
        } else {
          // Use a default nickname if creating a new profile
          updatedData.nickname = state.sellerProfile.userData?.name || 'Seller';
          console.log('Adding default nickname:', updatedData.nickname);
        }
      }

      console.log('Sending profile update with data:', updatedData);
      const response = await updateSellerProfile(updatedData);
      console.log('Profile update API response:', response);

      // Removed toast notification to avoid duplicate messages
      return response;
    } catch (error: any) {
      console.error('Profile update error:', error);
      // Keep error toast for general error handling
      toast.error(error.message || 'Failed to update profile');
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

const sellerProfileSlice = createSlice({
  name: 'sellerProfile',
  initialState,
  reducers: {
    resetProfileState: (state) => {
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile cases
      .addCase(fetchSellerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProfile.fulfilled, (state, action: PayloadAction<SellerProfileResponse>) => {
        state.loading = false;
        state.userData = action.payload.user;
        state.profileData = action.payload.profile;
        state.hasProfile = action.payload.hasProfile;
      })
      .addCase(fetchSellerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<SellerProfileData>) => {
        state.loading = false;
        state.profileData = action.payload;
        state.hasProfile = true;
        console.log('Profile updated in Redux state:', action.payload);
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetProfileState } = sellerProfileSlice.actions;
export default sellerProfileSlice.reducer;
