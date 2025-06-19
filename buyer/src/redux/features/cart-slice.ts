import { createSelector, createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { cartApi, Cart, CartItem, AddToCartRequest, UpdateCartItemRequest, RemoveFromCartRequest } from "@/services/cart";
import toast from "react-hot-toast";

type InitialState = {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  totalAmount: number;
  totalItems: number;
  lastUpdated: string | null;
  initialized: boolean;
  // Loading states for specific operations
  addingItem: boolean;
  updatingItem: boolean;
  removingItem: boolean;
  clearingCart: boolean;
};

const initialState: InitialState = {
  items: [],
  loading: false,
  error: null,
  totalAmount: 0,
  totalItems: 0,
  lastUpdated: null,
  initialized: false,
  addingItem: false,
  updatingItem: false,
  removingItem: false,
  clearingCart: false,
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const cart = await cartApi.getCart();
      return cart;
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      return rejectWithValue(error?.message || 'Failed to fetch cart');
    }
  }
);

export const addItemToCartAsync = createAsyncThunk(
  'cart/addItemToCart',
  async (item: AddToCartRequest, { rejectWithValue }) => {
    try {
      const cart = await cartApi.addToCart(item);
      toast.success(`${item.title} added to cart`);
      return cart;
    } catch (error: any) {
      const message = error?.message || 'Failed to add item to cart';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateCartItemAsync = createAsyncThunk(
  'cart/updateCartItem',
  async (update: UpdateCartItemRequest, { rejectWithValue }) => {
    try {
      const cart = await cartApi.updateCartItem(update);
      if (update.quantity === 0) {
        toast.success('Item removed from cart');
      } else {
        toast.success('Cart updated');
      }
      return cart;
    } catch (error: any) {
      const message = error?.message || 'Failed to update cart item';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeItemFromCartAsync = createAsyncThunk(
  'cart/removeItemFromCart',
  async (item: RemoveFromCartRequest, { rejectWithValue }) => {
    try {
      const cart = await cartApi.removeFromCart(item);
      toast.success('Item removed from cart');
      return cart;
    } catch (error: any) {
      const message = error?.message || 'Failed to remove item from cart';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const clearCartAsync = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const cart = await cartApi.clearCart();
      toast.success('Cart cleared');
      return cart;
    } catch (error: any) {
      const message = error?.message || 'Failed to clear cart';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Helper function to update state from cart data
const updateStateFromCart = (state: InitialState, cart: Cart) => {
  state.items = cart.items;
  state.totalAmount = cart.totalAmount;
  state.totalItems = cart.totalItems;
  state.lastUpdated = cart.lastUpdated;
  state.error = null;
  state.initialized = true;
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Clear error state
    clearCartError: (state) => {
      state.error = null;
    },
    // Reset cart state (useful for logout)
    resetCartState: (state) => {
      return { ...initialState };
    },
    // Optimistic updates (for immediate UI feedback)
    optimisticAddItem: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      // Recalculate totals
      state.totalAmount = state.items.reduce((total, item) => total + (item.discountedPrice * item.quantity), 0);
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
    },
    optimisticRemoveItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      // Recalculate totals
      state.totalAmount = state.items.reduce((total, item) => total + (item.discountedPrice * item.quantity), 0);
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
    },
    optimisticUpdateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter(item => item.id !== id);
      } else {
        const item = state.items.find(item => item.id === id);
        if (item) {
          item.quantity = quantity;
        }
      }
      // Recalculate totals
      state.totalAmount = state.items.reduce((total, item) => total + (item.discountedPrice * item.quantity), 0);
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        updateStateFromCart(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initialized = true; // Even on error, mark as initialized
      });

    // Add item to cart
    builder
      .addCase(addItemToCartAsync.pending, (state) => {
        state.addingItem = true;
        state.error = null;
      })
      .addCase(addItemToCartAsync.fulfilled, (state, action) => {
        state.addingItem = false;
        updateStateFromCart(state, action.payload);
      })
      .addCase(addItemToCartAsync.rejected, (state, action) => {
        state.addingItem = false;
        state.error = action.payload as string;
      });

    // Update cart item
    builder
      .addCase(updateCartItemAsync.pending, (state) => {
        state.updatingItem = true;
        state.error = null;
      })
      .addCase(updateCartItemAsync.fulfilled, (state, action) => {
        state.updatingItem = false;
        updateStateFromCart(state, action.payload);
      })
      .addCase(updateCartItemAsync.rejected, (state, action) => {
        state.updatingItem = false;
        state.error = action.payload as string;
      });

    // Remove item from cart
    builder
      .addCase(removeItemFromCartAsync.pending, (state) => {
        state.removingItem = true;
        state.error = null;
      })
      .addCase(removeItemFromCartAsync.fulfilled, (state, action) => {
        state.removingItem = false;
        updateStateFromCart(state, action.payload);
      })
      .addCase(removeItemFromCartAsync.rejected, (state, action) => {
        state.removingItem = false;
        state.error = action.payload as string;
      });

    // Clear cart
    builder
      .addCase(clearCartAsync.pending, (state) => {
        state.clearingCart = true;
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, (state, action) => {
        state.clearingCart = false;
        updateStateFromCart(state, action.payload);
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.clearingCart = false;
        state.error = action.payload as string;
      });
  },
});

// Selectors
export const selectCartItems = (state: RootState) => state.cartReducer.items;
export const selectCartLoading = (state: RootState) => state.cartReducer.loading;
export const selectCartError = (state: RootState) => state.cartReducer.error;
export const selectCartInitialized = (state: RootState) => state.cartReducer.initialized;
export const selectCartTotalAmount = (state: RootState) => state.cartReducer.totalAmount;
export const selectCartTotalItems = (state: RootState) => state.cartReducer.totalItems;
export const selectCartLastUpdated = (state: RootState) => state.cartReducer.lastUpdated;

// Loading selectors for specific operations
export const selectCartAddingItem = (state: RootState) => state.cartReducer.addingItem;
export const selectCartUpdatingItem = (state: RootState) => state.cartReducer.updatingItem;
export const selectCartRemovingItem = (state: RootState) => state.cartReducer.removingItem;
export const selectCartClearingCart = (state: RootState) => state.cartReducer.clearingCart;

// Memoized selectors
export const selectTotalPrice = createSelector([selectCartItems], (items) => {
  return items.reduce((total, item) => {
    return total + item.discountedPrice * item.quantity;
  }, 0);
});

export const selectCartItemCount = createSelector([selectCartItems], (items) => {
  return items.reduce((total, item) => total + item.quantity, 0);
});

export const selectCartItemById = createSelector(
  [selectCartItems, (state: RootState, id: string) => id],
  (items, id) => items.find(item => item.id === id)
);

export const selectIsItemInCart = createSelector(
  [selectCartItems, (state: RootState, id: string) => id],
  (items, id) => items.some(item => item.id === id)
);

// Actions
export const {
  clearCartError,
  resetCartState,
  optimisticAddItem,
  optimisticRemoveItem,
  optimisticUpdateQuantity,
} = cartSlice.actions;

export default cartSlice.reducer;

// Legacy exports for backward compatibility
export const addItemToCart = addItemToCartAsync;
export const removeItemFromCart = removeItemFromCartAsync;
export const updateCartItemQuantity = updateCartItemAsync;
export const removeAllItemsFromCart = clearCartAsync;

// Export the slice itself for potential future use
export const cart = cartSlice;
