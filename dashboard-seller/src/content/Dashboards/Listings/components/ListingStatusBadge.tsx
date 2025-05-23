import { FC } from 'react';
import { Typography, Chip } from '@mui/material';
import { getListingStatusColor } from '../utils/statusColors';

// Import types from the types file
import { ListingStatusType } from '../types';

interface ListingStatusBadgeProps {
  status?: ListingStatusType | string;
  variant?: 'text' | 'chip';
  size?: 'small' | 'medium';
}

const ListingStatusBadge: FC<ListingStatusBadgeProps> = ({
  status,
  variant = 'text',
  size = 'medium'
}) => {
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
  const statusColor = getListingStatusColor(validStatus);

  // Format the display text
  const getDisplayText = (status: string): string => {
    if (!status) return 'On Sale';
    return status === 'active' ? 'On Sale' : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const displayText = getDisplayText(validStatus);

  // Render as chip if variant is chip
  if (variant === 'chip') {
    let chipColor: 'success' | 'error' | 'warning' | 'default' | 'primary';

    switch (validStatus) {
      case 'active':
        chipColor = 'success';
        break;
      case 'sold':
        chipColor = 'error';
        break;
      case 'draft':
        chipColor = 'warning';
        break;
      case 'expired':
        chipColor = 'default';
        break;
      case 'suspended':
        chipColor = 'error';
        break;
      default:
        chipColor = 'default';
    }

    return (
      <Chip
        label={displayText}
        color={chipColor}
        size={size}
        sx={{
          fontWeight: 600,
          fontSize: size === 'small' ? '0.7rem' : '0.8rem'
        }}
      />
    );
  }

  // Default text variant
  return (
    <Typography
      variant="body1"
      fontWeight="bold"
      color={statusColor}
      noWrap
    >
      {displayText}
    </Typography>
  );
};

export default ListingStatusBadge;
