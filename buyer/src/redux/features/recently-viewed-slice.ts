import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types/product";

// Maximum number of recently viewed products to store
const MAX_RECENTLY_VIEWED = 8;

// Define the state type
type InitialState = {
  items: Product[];
};

// Load initial state from localStorage if available
const loadInitialState = (): InitialState => {
  if (typeof window !== 'undefined') {
    try {
      const savedItems = localStorage.getItem('recentlyViewedProducts');
      if (savedItems) {
        return {
          items: JSON.parse(savedItems)
        };
      }
    } catch (error) {
      console.error('Error loading recently viewed products from localStorage:', error);
    }
  }
  return { items: [] };
};

// Create the slice
export const recentlyViewed = createSlice({
  name: "recentlyViewed",
  initialState: loadInitialState(),
  reducers: {
    addRecentlyViewedProduct: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      
      // Check if product already exists in the list
      const existingIndex = state.items.findIndex(item => item.id === product.id);
      
      // If product exists, remove it (we'll add it to the front later)
      if (existingIndex !== -1) {
        state.items.splice(existingIndex, 1);
      }
      
      // Add product to the beginning of the array
      state.items.unshift(product);
      
      // Limit the number of items
      if (state.items.length > MAX_RECENTLY_VIEWED) {
        state.items = state.items.slice(0, MAX_RECENTLY_VIEWED);
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentlyViewedProducts', JSON.stringify(state.items));
      }
    },
    
    clearRecentlyViewedProducts: (state) => {
      state.items = [];
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('recentlyViewedProducts');
      }
    },
  },
});

export const { addRecentlyViewedProduct, clearRecentlyViewedProducts } = recentlyViewed.actions;
export default recentlyViewed.reducer;
