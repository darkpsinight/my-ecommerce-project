/**
 * Status color constants for consistent color coding across the application
 * These constants define the color scheme for different status types
 */

// Listing status colors (using MUI color palette references)
export const LISTING_STATUS_COLORS = {
  // "On Sale" (active) status - green color scheme
  active: {
    main: 'success.main',
    light: 'success.light',
    dark: 'success.dark',
    contrastText: 'success.contrastText',
    chipColor: 'success'
  },
  // "Sold Out" (sold) status - red/orange color scheme
  sold: {
    main: 'error.main',
    light: 'error.light',
    dark: 'error.dark',
    contrastText: 'error.contrastText',
    chipColor: 'error'
  },
  // "Draft" status - gray/neutral color scheme
  draft: {
    main: 'warning.main',
    light: 'warning.light',
    dark: 'warning.dark',
    contrastText: 'warning.contrastText',
    chipColor: 'warning'
  },
  // "Expired" status - purple/dark gray color scheme
  expired: {
    main: 'text.secondary',
    light: 'action.disabledBackground',
    dark: 'text.disabled',
    contrastText: 'text.primary',
    chipColor: 'default'
  },
  // "Suspended" status - distinct color
  suspended: {
    main: 'error.main',
    light: 'error.light',
    dark: 'error.dark',
    contrastText: 'error.contrastText',
    chipColor: 'error'
  },
  // "Deleted" status - dark gray/disabled color scheme
  deleted: {
    main: 'text.disabled',
    light: 'action.disabledBackground',
    dark: 'action.disabled',
    contrastText: 'text.secondary',
    chipColor: 'default'
  }
};

// Code status colors (using MUI color palette references)
export const CODE_STATUS_COLORS = {
  // "On Sale" (active) codes - green color scheme
  active: {
    main: 'success.main',
    light: 'success.light',
    dark: 'success.dark',
    contrastText: 'success.contrastText',
    chipColor: 'success'
  },
  // "Used" (sold) codes - red/orange color scheme
  sold: {
    main: 'error.main',
    light: 'error.light',
    dark: 'error.dark',
    contrastText: 'error.contrastText',
    chipColor: 'error'
  },
  // "Expired" codes - distinct color
  expired: {
    main: 'text.secondary',
    light: 'action.disabledBackground',
    dark: 'text.disabled',
    contrastText: 'text.primary',
    chipColor: 'default'
  },
  // "Draft" codes - gray/neutral color scheme
  draft: {
    main: 'warning.main',
    light: 'warning.light',
    dark: 'warning.dark',
    contrastText: 'warning.contrastText',
    chipColor: 'warning'
  },
  // "Deleted" codes - dark gray/disabled color scheme
  deleted: {
    main: 'text.disabled',
    light: 'action.disabledBackground',
    dark: 'action.disabled',
    contrastText: 'text.secondary',
    chipColor: 'default'
  }
};

// Helper function to get listing status color
export const getListingStatusColor = (status: string): string => {
  const validStatus = status?.toLowerCase() || 'active';
  return LISTING_STATUS_COLORS[validStatus]?.main || LISTING_STATUS_COLORS.active.main;
};

// Helper function to get listing status chip color
export const getListingStatusChipColor = (status: string): 'success' | 'error' | 'warning' | 'default' | 'primary' | 'secondary' | 'info' => {
  const validStatus = status?.toLowerCase() || 'active';
  return LISTING_STATUS_COLORS[validStatus]?.chipColor || LISTING_STATUS_COLORS.active.chipColor;
};

// Helper function to get code status color
export const getCodeStatusColor = (status: string): string => {
  const validStatus = status?.toLowerCase() || 'active';
  return CODE_STATUS_COLORS[validStatus]?.main || CODE_STATUS_COLORS.active.main;
};

// Helper function to get code status chip color
export const getCodeStatusChipColor = (status: string): 'success' | 'error' | 'warning' | 'default' | 'primary' | 'secondary' | 'info' => {
  const validStatus = status?.toLowerCase() || 'active';
  return CODE_STATUS_COLORS[validStatus]?.chipColor || CODE_STATUS_COLORS.active.chipColor;
};
