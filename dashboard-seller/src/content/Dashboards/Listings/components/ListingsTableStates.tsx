import { FC } from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  CircularProgress,
  Alert
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
  colSpan: number;
}

export const LoadingState: FC<LoadingStateProps> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} align="center" sx={{ py: 3 }}>
      <CircularProgress size={30} />
      <Typography variant="body1" sx={{ mt: 1 }} color="text.secondary">
        Loading listings...
      </Typography>
    </TableCell>
  </TableRow>
);

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
