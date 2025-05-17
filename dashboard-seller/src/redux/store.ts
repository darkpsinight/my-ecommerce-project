import { configureStore } from '@reduxjs/toolkit';
import configReducer from './slices/configSlice';
import authReducer from './slices/authSlice';
import listingsSummaryReducer from './slices/listingsSummarySlice';

export const store = configureStore({
  reducer: {
    config: configReducer,
    auth: authReducer,
    listingsSummary: listingsSummaryReducer
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['config/fetchConfigData/rejected'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;