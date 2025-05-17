import { FC } from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Alert,
  Skeleton,
  Box
} from '@mui/material';

interface EmptyStateProps {
  colSpan: number;
}

export const EmptyState: FC<EmptyStateProps> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 3 }}>
      <Typography variant="h6" color="text.secondary">
        No listings found
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Create your first listing to get started
      </Typography>
    </TableCell>
  </TableRow>
);

interface LoadingStateProps {
  colSpan: number; // Kept for consistency with other state components
  rowsCount?: number;
}

export const LoadingState: FC<LoadingStateProps> = ({ rowsCount = 5 }) => {
  // Create an array of the specified length to map over
  const skeletonRows = Array.from({ length: rowsCount }, (_, index) => index);

  return (
    <>
      {skeletonRows.map((_, index) => (
        <TableRow key={`skeleton-row-${index}`}>
          {/* Checkbox column */}
          <TableCell padding="checkbox">
            <Skeleton variant="rectangular" width={20} height={20} />
          </TableCell>

          {/* Title column */}
          <TableCell>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
          </TableCell>

          {/* Platform column */}
          <TableCell>
            <Skeleton variant="text" width={80} height={24} />
          </TableCell>

          {/* On Sale column */}
          <TableCell align="center">
            <Skeleton variant="rectangular" width={40} height={24} sx={{ mx: 'auto' }} />
          </TableCell>

          {/* Total column */}
          <TableCell align="center">
            <Skeleton variant="rectangular" width={40} height={24} sx={{ mx: 'auto' }} />
          </TableCell>

          {/* Price column */}
          <TableCell align="right">
            <Skeleton variant="text" width={60} height={24} sx={{ ml: 'auto' }} />
          </TableCell>

          {/* Status column */}
          <TableCell>
            <Skeleton variant="rectangular" width={80} height={30} sx={{ borderRadius: 1 }} />
          </TableCell>

          {/* Created column */}
          <TableCell>
            <Skeleton variant="text" width={90} height={24} />
          </TableCell>

          {/* Actions column */}
          <TableCell align="right">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

interface ErrorStateProps {
  colSpan: number;
  error: string;
}

export const ErrorState: FC<ErrorStateProps> = ({ colSpan, error }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 3 }}>
      <Alert severity="error" sx={{ justifyContent: 'center' }}>
        {error}
      </Alert>
    </TableCell>
  </TableRow>
);
