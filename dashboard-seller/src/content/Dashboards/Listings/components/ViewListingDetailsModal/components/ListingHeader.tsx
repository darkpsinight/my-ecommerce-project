import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Chip,
  useMediaQuery
} from '@mui/material';
import { Listing } from '../../../types';
import ListingStatusBadge from '../../ListingStatusBadge';
import { formatCurrency } from '../utils/formatters';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import UpdateIcon from '@mui/icons-material/Update';

interface ListingHeaderProps {
  listing: Listing;
  discountPercentage: number | null;
}

const ListingHeader: React.FC<ListingHeaderProps> = ({
  listing,
  discountPercentage
}) => {
  const theme = useTheme();
  const isVerySmallScreen = useMediaQuery('(max-width:380px)');

  // Get status color based on listing status
  const getStatusColor = () => {
    switch (listing.status) {
      case 'active':
        return theme.palette.success.main;
      case 'draft':
        return theme.palette.warning.main;
      case 'expired':
        return theme.palette.text.secondary;
      case 'suspended':
        return theme.palette.error.main;
      case 'sold':
        return theme.palette.info.main;
      default:
        return theme.palette.text.primary;
    }
  };

  // Get status background color based on listing status
  const getStatusBgColor = () => {
    switch (listing.status) {
      case 'active':
        return alpha(theme.palette.success.light, 0.1);
      case 'draft':
        return alpha(theme.palette.warning.light, 0.1);
      case 'expired':
        return alpha(theme.palette.text.secondary, 0.1);
      case 'suspended':
        return alpha(theme.palette.error.light, 0.1);
      case 'sold':
        return alpha(theme.palette.info.light, 0.1);
      default:
        return alpha(theme.palette.text.primary, 0.1);
    }
  };

  // Get status border color based on listing status
  const getStatusBorderColor = () => {
    switch (listing.status) {
      case 'active':
        return alpha(theme.palette.success.main, 0.2);
      case 'draft':
        return alpha(theme.palette.warning.main, 0.2);
      case 'expired':
        return alpha(theme.palette.text.secondary, 0.2);
      case 'suspended':
        return alpha(theme.palette.error.main, 0.2);
      case 'sold':
        return alpha(theme.palette.info.main, 0.2);
      default:
        return alpha(theme.palette.text.primary, 0.2);
    }
  };

  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';

    const dateObj = new Date(date);

    // Format: "May 7, 2025, 08:15 PM"
    return (
      dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) +
      ', ' +
      dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    );
  };

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 2.5 },
        pb: { xs: 0.5, sm: 1 },
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Title, Status and Price Row */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row', // Always row to keep price on right
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 1 },
          mb: { xs: 1, sm: 1.5 }
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1.5,
              fontSize: { xs: '0.95rem', sm: '1.2rem', md: '1.4rem' },
              lineHeight: 1.2,
              wordBreak: 'break-word',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, sm: 2 },
              WebkitBoxOrient: 'vertical'
            }}
          >
            {listing.title}
          </Typography>

          {/* Status and Price Row */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              mb: { xs: 1, sm: 0 }
            }}
          >
            {/* Status badge with icon and colored background */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 1.5 },
                p: { xs: 0.5, sm: 1 },
                pl: { xs: 0.75, sm: 1.5 },
                pr: { xs: 1, sm: 2 },
                borderRadius: 2,
                bgcolor: getStatusBgColor(),
                border: `1px solid ${getStatusBorderColor()}`
              }}
            >
              {/* Status icon */}
              {listing.status === 'active' ? (
                <VisibilityIcon
                  sx={{
                    color: getStatusColor(),
                    fontSize: { xs: '0.8rem', sm: '1rem' }
                  }}
                />
              ) : (
                <VisibilityOffIcon
                  sx={{
                    color: getStatusColor(),
                    fontSize: { xs: '0.8rem', sm: '1rem' }
                  }}
                />
              )}

              {/* Status badge - custom styling for small screens */}
              <Typography
                variant="body1"
                fontWeight="bold"
                color={getStatusColor()}
                noWrap
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
                }}
              >
                {listing.status
                  ? listing.status.toString() === 'active'
                    ? 'On Sale'
                    : listing.status.toString().charAt(0).toUpperCase() +
                      listing.status.toString().slice(1)
                  : 'On Sale'}
              </Typography>
            </Box>

            {/* Price display - now inside the same row as status */}
            {listing.price !== undefined && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: { xs: 0.5, sm: 1 },
                  justifyContent: 'flex-end',
                  minWidth: { xs: '30%', sm: '25%' }
                }}
              >
                <Typography
                  variant="h4"
                  component="span"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    lineHeight: 1,
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                    textAlign: 'right'
                  }}
                >
                  {formatCurrency(listing.price)}
                </Typography>

                {discountPercentage && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end'
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        textDecoration: 'line-through',
                        color: theme.palette.text.secondary,
                        mb: -0.5,
                        fontSize: { xs: '0.65rem', sm: '0.75rem' }
                      }}
                    >
                      {formatCurrency(listing.originalPrice)}
                    </Typography>
                    <Chip
                      label={`-${discountPercentage}%`}
                      size="small"
                      color="error"
                      sx={{
                        height: { xs: 16, sm: 20 },
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        fontWeight: 'bold',
                        '& .MuiChip-label': {
                          px: { xs: 0.5, sm: 0.75 }
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ListingHeader;
