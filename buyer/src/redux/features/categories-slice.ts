import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Category } from "@/types/category";
import { getCategories } from "@/services/category";
import { RootState } from "../store";

type CategoriesState = {
  items: Category[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: CategoriesState = {
  items: [],
  status: 'idle',
  error: null
};

// Async thunk for fetching categories
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const response = await getCategories();
    return response || [];
  }
);

export const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // If we need any synchronous actions, we can add them here
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch categories';
      });
  },
});

// Selectors
export const selectAllCategories = (state: RootState) => state.categoriesReducer.items;
export const selectCategoriesStatus = (state: RootState) => state.categoriesReducer.status;
export const selectCategoriesError = (state: RootState) => state.categoriesReducer.error;

export default categoriesSlice.reducer;
