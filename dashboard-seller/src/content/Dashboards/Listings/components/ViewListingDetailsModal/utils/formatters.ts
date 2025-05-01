import { format } from 'date-fns';

export const formatDate = (dateValue: Date | string | null): string => {
  if (!dateValue) return 'N/A';

  try {
    // Handle both string dates and Date objects
    const dateObj =
      typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return format(dateObj, 'MMM dd, yyyy hh:mm a');
  } catch (error) {
    console.error('Invalid date format:', dateValue);
    return 'Invalid date';
  }
};

export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};
