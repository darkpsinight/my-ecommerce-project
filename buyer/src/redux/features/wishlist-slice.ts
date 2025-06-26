import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { 
  getUserWishlist, 
  addItemToWishlist as addItemToWishlistAPI, 
  removeItemFromWishlist as removeItemFromWishlistAPI, 
  clearWishlist as clearWishlistAPI,
  WishlistItem
} from "@/services/wishlist";

type InitialState = {
  items: WishListItem[];
  isLoading: boolean;
  error: string | null;
};

type WishListItem = {
  id: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  status?: string;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  categoryName?: string;
  platform?: string;
  region?: string;
  sellerId?: string;
  sellerMarketName?: string;
  quantityOfActiveCodes?: number;
  addedAt?: string;
};

const initialState: InitialState = {
  items: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchWishlistAsync = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUserWishlist();
      if (response.error) {
        return rejectWithValue(response.message || 'Failed to fetch wishlist');
      }
      return response.data?.items || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch wishlist');
    }
  }
);

export const addItemToWishlistAsync = createAsyncThunk(
  'wishlist/addItem',
  async (item: WishListItem, { rejectWithValue }) => {
    try {
      const response = await addItemToWishlistAPI(item.id);
      if (response.error) {
        return rejectWithValue(response.message || 'Failed to add item to wishlist');
      }
      return item;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add item to wishlist');
    }
  }
);

export const removeItemFromWishlistAsync = createAsyncThunk(
  'wishlist/removeItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const response = await removeItemFromWishlistAPI(itemId);
      if (response.error) {
        return rejectWithValue(response.message || 'Failed to remove item from wishlist');
      }
      return itemId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove item from wishlist');
    }
  }
);

export const clearWishlistAsync = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await clearWishlistAPI();
      if (response.error) {
        return rejectWithValue(response.message || 'Failed to clear wishlist');
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear wishlist');
    }
  }
);

export const wishlist = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    // Synchronous actions for local state updates
    setWishlistItems: (state, action: PayloadAction<WishListItem[]>) => {
      state.items = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch wishlist
    builder
      .addCase(fetchWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlistAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
    // Add item to wishlist
    builder
      .addCase(addItemToWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addItemToWishlistAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const existingItem = state.items.find((item) => item.id === action.payload.id);
        if (!existingItem) {
          state.items.push(action.payload);
        }
      })
      .addCase(addItemToWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
    // Remove item from wishlist
    builder
      .addCase(removeItemFromWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeItemFromWishlistAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(removeItemFromWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
    // Clear wishlist
    builder
      .addCase(clearWishlistAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearWishlistAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
      })
      .addCase(clearWishlistAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setWishlistItems,
  clearError,
} = wishlist.actions;

// Selectors
export const selectWishlistItems = (state: { wishlistReducer: InitialState }) => state.wishlistReducer.items;
export const selectWishlistLoading = (state: { wishlistReducer: InitialState }) => state.wishlistReducer.isLoading;
export const selectWishlistError = (state: { wishlistReducer: InitialState }) => state.wishlistReducer.error;
export const selectIsItemInWishlist = (state: { wishlistReducer: InitialState }, productId: string) => 
  state.wishlistReducer.items.some(item => item.id === productId);
export const selectWishlistCount = (state: { wishlistReducer: InitialState }) => state.wishlistReducer.items.length;

export default wishlist.reducer;
