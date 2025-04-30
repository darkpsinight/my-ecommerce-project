import { FC } from 'react';
import { Typography } from '@mui/material';
import { ListingStatus } from '../types';

interface ListingStatusBadgeProps {
  status: ListingStatus;
}

const ListingStatusBadge: FC<ListingStatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: ListingStatus): string => {
    switch (status) {
      case 'active':
        return 'success.main';
      case 'sold':
        return 'info.main';
      case 'draft':
        return 'warning.main';
      case 'expired':
        return 'text.secondary';
      case 'paused':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <Typography
      variant="body1"
      fontWeight="bold"
      color={getStatusColor(status || 'active')}
      noWrap
    >
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active'}
    </Typography>
  );
};

export default ListingStatusBadge;
