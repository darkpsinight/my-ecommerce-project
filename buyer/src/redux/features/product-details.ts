import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types/product";

type InitialState = {
  value: Product;
  lastUpdated: number;
};

const initialState = {
  value: {
    title: "",
    reviews: 0,
    price: 0,
    discountedPrice: 0,
    img: "",
    images: [],
    id: "",
    imgs: { thumbnails: [], previews: [] },
  },
  lastUpdated: 0,
} as InitialState;

export const productDetails = createSlice({
  name: "productDetails",
  initialState,
  reducers: {
    updateproductDetails: (state, action: PayloadAction<Product>) => {
      // Only update if the product ID is different or if it's been more than 1 second since the last update
      const now = Date.now();
      const productId = action.payload.id?.toString();
      const currentProductId = state.value.id?.toString();

      if (productId !== currentProductId || now - state.lastUpdated > 1000) {
        console.log(`Updating product details in Redux store. ID: ${productId}, Previous ID: ${currentProductId}`);
        return {
          value: {
            ...action.payload,
          },
          lastUpdated: now,
        };
      }

      return state;
    },

    clearProductDetails: () => {
      return initialState;
    },
  },
});

export const { updateproductDetails, clearProductDetails } = productDetails.actions;
export default productDetails.reducer;
