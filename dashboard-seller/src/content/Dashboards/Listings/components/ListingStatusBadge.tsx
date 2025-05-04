import { FC } from 'react';
import { Typography } from '@mui/material';

// Define status type locally to avoid import issues
type ListingStatusType = 'active' | 'sold' | 'expired' | 'suspended' | 'draft';

interface ListingStatusBadgeProps {
  status?: ListingStatusType | string;
}

const ListingStatusBadge: FC<ListingStatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: ListingStatusType): string => {
    switch (status) {
      case 'active':
        return 'success.main';
      case 'sold':
        return 'info.main';
      case 'draft':
        return 'warning.main';
      case 'expired':
        return 'text.secondary';
      case 'suspended':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  // Ensure status is a valid ListingStatusType
  const getValidStatus = (statusValue?: ListingStatusType | string): ListingStatusType => {
    if (!statusValue) return 'active';
    
    switch (statusValue) {
      case 'active':
      case 'sold':
      case 'draft':
      case 'expired':
      case 'suspended':
        return statusValue as ListingStatusType;
      default:
        return 'active';
    }
  };

  const validStatus = getValidStatus(status);

  return (
    <Typography
      variant="body1"
      fontWeight="bold"
      color={getStatusColor(validStatus)}
      noWrap
    >
      {status ? status.toString().charAt(0).toUpperCase() + status.toString().slice(1) : 'Active'}
    </Typography>
  );
};

export default ListingStatusBadge;
