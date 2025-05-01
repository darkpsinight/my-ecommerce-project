import React from 'react';
import { Box, Typography, useTheme, alpha, Chip } from '@mui/material';
import { Listing } from '../../../types';
import ListingStatusBadge from '../../ListingStatusBadge';
import { formatCurrency } from '../utils/formatters';

interface ListingHeaderProps {
  listing: Listing;
  discountPercentage: number | null;
}

const ListingHeader: React.FC<ListingHeaderProps> = ({ listing, discountPercentage }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        px: 3,
        pt: 2.5,
        pb: 1,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1
      }}
    >
      <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 0.5
          }}
        >
          {listing.title}
        </Typography>
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
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
            ID: {listing._id}
          </Typography>
        </Box>
      </Box>

      {/* Price display */}
      {listing.price !== undefined && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1
          }}
        >
          <Typography
            variant="h4"
            component="span"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              lineHeight: 1
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
  );
};

export default ListingHeader;
