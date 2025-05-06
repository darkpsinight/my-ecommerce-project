import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
  CardMedia
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';

import { Listing } from '../../../../types';

interface ImagesTabProps {
  listing: Listing;
}

const ImagesTab: React.FC<ImagesTabProps> = ({ listing }) => {
  const theme = useTheme();

  const hasThumbnail = listing.thumbnailUrl && listing.thumbnailUrl.trim() !== '';

  return (
    <Card
      variant="outlined"
      sx={{
        boxShadow: theme.shadows[1],
        overflow: 'hidden'
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ImageIcon
            sx={{
              mr: 1,
              color: theme.palette.warning.main,
              fontSize: 20
            }}
          />
          Product Thumbnail
        </Typography>

        {hasThumbnail ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 2,
              backgroundColor: alpha(
                theme.palette.common.black,
                0.03
              ),
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <CardMedia
              component="img"
              src={listing.thumbnailUrl}
              alt={listing.title}
              sx={{
                maxWidth: '100%',
                maxHeight: 300,
                objectFit: 'contain',
                borderRadius: 1
              }}
            />
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ mb: 1 }}
            >
              No thumbnail image available for this listing.
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
            >
              You can add a thumbnail when editing this listing.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ImagesTab;
