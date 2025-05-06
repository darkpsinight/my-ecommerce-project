import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Chip,
  Tooltip,
  Grid,
  useMediaQuery,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Listing } from '../../../types';
import ListingStatusBadge from '../../ListingStatusBadge';
import { formatCurrency } from '../../ViewListingDetailsModal/utils/formatters';
import UpdateIcon from '@mui/icons-material/Update';
import CategoryIcon from '@mui/icons-material/Category';
import DevicesIcon from '@mui/icons-material/Devices';
import LockIcon from '@mui/icons-material/Lock';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface ListingHeaderProps {
  listing: Listing;
  discountPercentage: number | null;
  lastUpdated: string | Date | null;
  onStatusChange?: (newStatus: 'active' | 'draft') => void;
}

const ListingHeader: React.FC<ListingHeaderProps> = ({
  listing,
  discountPercentage,
  lastUpdated,
  onStatusChange
}) => {
  const theme = useTheme();
  const isVerySmallScreen = useMediaQuery('(max-width:380px)');
  const isMobileScreen = useMediaQuery('(max-width:600px)');

  // Handle status toggle between active and draft
  const handleStatusChange = () => {
    if (onStatusChange) {
      const newStatus = listing.status === 'active' ? 'draft' : 'active';
      onStatusChange(newStatus);
    }
  };

  const formatDate = (date: string | Date | null): string => {
    if (!date) return '';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Invalid date format:', date);
      return '';
    }
  };

  // Get category name from the listing object
  const getCategoryName = () => {
    if (listing.categoryId && typeof listing.categoryId === 'object' && listing.categoryId.name) {
      return listing.categoryId.name;
    }

    // Fallback to categoryName if available
    if (listing.categoryName) {
      return listing.categoryName;
    }

    return 'Unknown Category';
  };

  return (
    <Box
      sx={{
        px: { xs: isVerySmallScreen ? 1 : 1.5, sm: 3 },
        pt: { xs: isVerySmallScreen ? 1 : 1.5, sm: 2.5 },
        pb: { xs: 0.5, sm: 1 },
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: isVerySmallScreen ? 0.5 : 0.75, sm: 1 }
      }}
    >
      {/* Title and Status/Price Row */}
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: { xs: 1, sm: 1.5 },
            fontSize: {
              xs: isVerySmallScreen ? '0.95rem' : '1.1rem',
              sm: '1.3rem',
              md: '1.5rem'
            },
            lineHeight: 1.2,
            wordBreak: 'break-word'
          }}
        >
          {listing.title}
        </Typography>

        {/* Status and Price in one row on mobile */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1
          }}
        >
          {/* Status badge and switch */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 2 },
              p: { xs: 0.75, sm: 1 },
              pl: { xs: 1, sm: 1.5 },
              pr: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              bgcolor: alpha(
                listing.status === 'active'
                  ? theme.palette.success.light
                  : theme.palette.warning.light,
                0.1
              ),
              border: `1px solid ${alpha(
                listing.status === 'active'
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                0.2
              )}`,
            }}
          >
            {/* Status icon */}
            {!isVerySmallScreen && (
              listing.status === 'active'
                ? <VisibilityIcon sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
                : <VisibilityOffIcon sx={{ color: theme.palette.warning.main, fontSize: '1rem' }} />
            )}

            {/* Status badge */}
            <ListingStatusBadge status={listing.status} />

            {/* Status switch */}
            {onStatusChange && (
              <FormControlLabel
                control={
                  <Switch
                    checked={listing.status === 'active'}
                    onChange={handleStatusChange}
                    name="status"
                    color={listing.status === 'active' ? 'success' : 'warning'}
                    size="small"
                  />
                }
                label={
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {listing.status === 'active' ? 'Set Draft' : 'Publish'}
                  </Typography>
                }
                sx={{
                  m: 0,
                  ml: { xs: 0.5, sm: 1 },
                  '.MuiFormControlLabel-label': {
                    ml: 0.5
                  }
                }}
              />
            )}
          </Box>

          {/* Price display */}
          {listing.price !== undefined && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 0.5
              }}
            >
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  lineHeight: 1,
                  fontSize: {
                    xs: isVerySmallScreen ? '1.1rem' : '1.3rem',
                    sm: '1.75rem',
                    md: '2rem'
                  }
                }}
              >
                {formatCurrency(listing.price)}
              </Typography>

              {discountPercentage !== null && (
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
                      fontSize: isVerySmallScreen ? '0.7rem' : '0.75rem'
                    }}
                  >
                    {formatCurrency(listing.originalPrice)}
                  </Typography>
                  <Chip
                    label={`-${discountPercentage}%`}
                    size="small"
                    color="error"
                    sx={{
                      height: isVerySmallScreen ? 16 : 20,
                      fontSize: isVerySmallScreen ? '0.6rem' : '0.7rem',
                      fontWeight: 'bold',
                      '& .MuiChip-label': {
                        px: isVerySmallScreen ? 0.5 : 0.75
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* ID display - smaller and less prominent */}
        {!isVerySmallScreen && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              bgcolor: alpha(theme.palette.background.default, 0.7),
              px: 1,
              py: 0.25,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              alignSelf: 'flex-start',
              mb: 1,
              display: 'inline-block'
            }}
          >
            ID: {listing.externalId}
          </Typography>
        )}
      </Box>

      {/* Category and Platform display - more compact */}
      <Box
        sx={{
          mt: isVerySmallScreen ? 0.5 : 1,
          p: isVerySmallScreen ? 0.75 : 1.25,
          bgcolor: alpha(theme.palette.background.default, 0.6),
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        {isMobileScreen ? (
          // Compact view for mobile screens
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Header with only the lock icon */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: -0.5 }}>
              <Tooltip title="Category and platform cannot be changed after listing creation">
                <LockIcon fontSize="small" color="action" sx={{ fontSize: '0.75rem' }} />
              </Tooltip>
            </Box>

            {/* Compact category and platform display */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: isVerySmallScreen ? 0.5 : 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Category">
                  <CategoryIcon color="primary" sx={{ fontSize: isVerySmallScreen ? '0.9rem' : '1rem' }} />
                </Tooltip>
                {!isVerySmallScreen && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', mr: 0.5 }}>
                    Category:
                  </Typography>
                )}
                <Chip
                  label={getCategoryName()}
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{
                    height: isVerySmallScreen ? 22 : 24,
                    '& .MuiChip-label': { px: isVerySmallScreen ? 0.75 : 1, fontSize: isVerySmallScreen ? '0.65rem' : '0.7rem' }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Platform">
                  <DevicesIcon color="primary" sx={{ fontSize: isVerySmallScreen ? '0.9rem' : '1rem' }} />
                </Tooltip>
                {!isVerySmallScreen && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', mr: 0.5 }}>
                    Platform:
                  </Typography>
                )}
                <Chip
                  label={listing.platform || 'Not specified'}
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{
                    height: isVerySmallScreen ? 22 : 24,
                    '& .MuiChip-label': { px: isVerySmallScreen ? 0.75 : 1, fontSize: isVerySmallScreen ? '0.65rem' : '0.7rem' }
                  }}
                />
              </Box>
            </Box>
          </Box>
        ) : (
          // Regular view for larger screens
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="primary" />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle2">Category</Typography>
                    <Tooltip title="Category cannot be changed after listing creation">
                      <LockIcon fontSize="small" color="action" sx={{ fontSize: '0.875rem' }} />
                    </Tooltip>
                  </Box>
                  <Chip
                    label={getCategoryName()}
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{ mt: 0.5, fontWeight: 'medium' }}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DevicesIcon color="primary" />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle2">Platform</Typography>
                    <Tooltip title="Platform cannot be changed after listing creation">
                      <LockIcon fontSize="small" color="action" sx={{ fontSize: '0.875rem' }} />
                    </Tooltip>
                  </Box>
                  <Chip
                    label={listing.platform || 'Not specified'}
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{ mt: 0.5, fontWeight: 'medium' }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Last updated info moved to bottom */}
      {lastUpdated && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-end',
            mt: 0.5
          }}
        >
          <UpdateIcon
            fontSize="small"
            sx={{
              color: theme.palette.text.secondary,
              mr: 0.5,
              fontSize: isVerySmallScreen ? '0.7rem' : '0.75rem'
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: isVerySmallScreen ? '0.6rem' : '0.7rem'
            }}
          >
            <b>Updated:</b> {formatDate(lastUpdated)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ListingHeader;