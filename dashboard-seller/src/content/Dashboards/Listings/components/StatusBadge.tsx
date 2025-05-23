import { FC } from 'react';
import { Chip } from '@mui/material';
import { getListingStatusChipColor, getCodeStatusChipColor } from '../utils/statusColors';

interface StatusBadgeProps {
  status: string;
  type: 'listing' | 'code';
  size?: 'small' | 'medium';
}

/**
 * A standardized status badge component for displaying listing or code statuses
 *
 * @param status - The status value ('active', 'sold', 'draft', 'expired', etc.)
 * @param type - Whether this is a listing status or code status
 * @param size - The size of the chip (small or medium)
 */
const StatusBadge: FC<StatusBadgeProps> = ({
  status,
  type,
  size = 'small'
}) => {
  // Format the display text based on status and type
  const getDisplayText = (status: string, type: 'listing' | 'code'): string => {
    if (!status) return 'On Sale';

    if (status === 'active') {
      return 'On Sale';
    } else if (status === 'sold') {
      return type === 'listing' ? 'Sold Out' : 'Used';
    } else {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const displayText = getDisplayText(status, type);

  // Get the appropriate color based on type
  const chipColor = type === 'listing'
    ? getListingStatusChipColor(status)
    : getCodeStatusChipColor(status);

  return (
    <Chip
      label={displayText}
      color={chipColor}
      size={size}
      // No variant specified to match listing status badge styling
      sx={{
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem'
      }}
    />
  );
};

export default StatusBadge;
