import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getListingsSummary } from 'src/services/api/listings';

// Define the type for the summary data
export interface SummaryData {
  activeListings: number;
  soldCodes: number;
  totalRevenue: number;
}

// Define the state type
interface ListingsSummaryState {
  data: SummaryData;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetchTimestamp: number | null;
}

// Initial state
const initialState: ListingsSummaryState = {
  data: {
    activeListings: 0,
    soldCodes: 0,
    totalRevenue: 0
  },
  status: 'idle',
  error: null,
  lastFetchTimestamp: null
};

// Create the async thunk for fetching summary data
export const fetchListingsSummary = createAsyncThunk(
  'listingsSummary/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getListingsSummary();

      if (response && response.success && response.data) {
        return {
          activeListings: response.data.activeListings || 0,
          soldCodes: response.data.soldCodes || 0,
          totalRevenue: response.data.totalRevenue || 0
        };
      } else {
        return rejectWithValue(response.message || 'Failed to fetch summary data');
      }
    } catch (error) {
      console.error('Error fetching listings summary:', error);
      return rejectWithValue(error.message || 'An error occurred while fetching summary data');
    }
  }
);

// Create the listings summary slice
const listingsSummarySlice = createSlice({
  name: 'listingsSummary',
  initialState,
  reducers: {
    // Manual update for when we know a listing was created, edited, or deleted
    // This allows us to update the counts without a full API refresh
    updateActiveListingsCount: (state, action: PayloadAction<number>) => {
      state.data.activeListings = action.payload;
    },
    incrementActiveListings: (state) => {
      state.data.activeListings += 1;
    },
    decrementActiveListings: (state) => {
      state.data.activeListings = Math.max(0, state.data.activeListings - 1);
    },
    resetSummaryState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListingsSummary.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchListingsSummary.fulfilled, (state, action: PayloadAction<SummaryData>) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.error = null;
        state.lastFetchTimestamp = Date.now();
      })
      .addCase(fetchListingsSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Something went wrong';
      });
  }
});

// Export actions
export const {
  updateActiveListingsCount,
  incrementActiveListings,
  decrementActiveListings,
  resetSummaryState
} = listingsSummarySlice.actions;

// Export selectors (without RootState type to avoid circular dependency)
export const selectListingsSummary = (state: any) => state.listingsSummary.data;
export const selectListingsSummaryStatus = (state: any) => state.listingsSummary.status;
export const selectListingsSummaryError = (state: any) => state.listingsSummary.error;

export default listingsSummarySlice.reducer;
