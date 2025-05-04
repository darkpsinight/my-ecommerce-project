import React from 'react';
import { Box, Typography, useTheme, alpha, Chip, IconButton, Tooltip, Grid, Divider } from '@mui/material';
import { Listing } from '../../../types';
import ListingStatusBadge from '../../ListingStatusBadge';
import { formatCurrency } from '../../ViewListingDetailsModal/utils/formatters';
import EditIcon from '@mui/icons-material/Edit';
import UpdateIcon from '@mui/icons-material/Update';
import CategoryIcon from '@mui/icons-material/Category';
import DevicesIcon from '@mui/icons-material/Devices';
import LockIcon from '@mui/icons-material/Lock';

interface ListingHeaderProps {
  listing: Listing;
  discountPercentage: number | null;
  lastUpdated: string | Date | null;
}

const ListingHeader: React.FC<ListingHeaderProps> = ({ listing, discountPercentage, lastUpdated }) => {
  const theme = useTheme();

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
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 2.5 },
        pb: { xs: 0.5, sm: 1 },
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1, sm: 1 }
      }}
    >
      {/* Last updated info */}
      {lastUpdated && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            alignSelf: 'flex-end',
            mb: 1
          }}
        >
          <UpdateIcon 
            fontSize="small" 
            sx={{ 
              color: theme.palette.text.secondary,
              mr: 0.5,
              fontSize: '0.875rem'
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            <b>Last updated:</b> {formatDate(lastUpdated)}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, sm: 1 }
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 2,
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
              lineHeight: 1.2,
              wordBreak: 'break-word'
            }}
          >
            {listing.title}
          </Typography>
          <Box 
            display="flex" 
            alignItems="center" 
            flexWrap="wrap" 
            gap={1}
            sx={{ mb: { xs: 1, sm: 0 } }}
          >
            <ListingStatusBadge status={listing.status} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                bgcolor: alpha(theme.palette.background.default, 0.7),
                px: 1,
                py: 0.5,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              ID: {listing.externalId}
            </Typography>
          </Box>
        </Box>

        {/* Price display */}
        {listing.price !== undefined && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 1,
              alignSelf: { xs: 'flex-start', sm: 'center' },
              mt: { xs: 0.5, sm: 0 },
              mb: { xs: 1, sm: 0 }
            }}
          >
            <Typography
              variant="h4"
              component="span"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                lineHeight: 1,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
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
                    mb: -0.5
                  }}
                >
                  {formatCurrency(listing.originalPrice)}
                </Typography>
                <Chip
                  label={`-${discountPercentage}%`}
                  size="small"
                  color="error"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Category and Platform display */}
      <Box 
        sx={{ 
          mt: 2, 
          mb: 1,
          p: 1.5,
          bgcolor: alpha(theme.palette.background.default, 0.6),
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
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
      </Box>
    </Box>
  );
};

export default ListingHeader;
