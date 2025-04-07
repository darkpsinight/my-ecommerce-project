import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getPublicConfigs } from 'src/services/config';

// Define the type for the config state
interface Config {
  APP_NAME: string;
  [key: string]: any;
}

// Define the state type
interface ConfigState {
  data: Config;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetchTimestamp: number | null;
}

// Initial state
const initialState: ConfigState = {
  data: { APP_NAME: '' },
  status: 'idle',
  error: null,
  lastFetchTimestamp: null
};

// Create an async thunk for fetching config data
export const fetchConfigData = createAsyncThunk(
  'config/fetchConfigData',
  async (_, { rejectWithValue }) => {
    try {
      const configs = await getPublicConfigs();
      return configs;
    } catch (error) {
      return rejectWithValue('Failed to fetch configurations');
    }
  }
);

// Create the config slice
const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    // If we need synchronous actions we can add them here
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConfigData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchConfigData.fulfilled, (state, action: PayloadAction<Config>) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.lastFetchTimestamp = Date.now();
      })
      .addCase(fetchConfigData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Something went wrong';
      });
  }
});

export default configSlice.reducer; 