import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
  CardMedia,
  IconButton,
  Tooltip
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { toast } from 'react-hot-toast';

import { Listing } from '../../../../types';

interface ImagesTabProps {
  listing: Listing;
}

const ImagesTab: React.FC<ImagesTabProps> = ({ listing }) => {
  const theme = useTheme();
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const hasThumbnail = listing.thumbnailUrl && listing.thumbnailUrl.trim() !== '';

  const handleCopyImageUrl = () => {
    if (listing.thumbnailUrl) {
      navigator.clipboard
        .writeText(listing.thumbnailUrl)
        .then(() => {
          setCopySuccess(true);
          toast.success('Image link copied to clipboard');
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch((err) => {
          console.error('Failed to copy image link:', err);
          toast.error('Failed to copy image link');
        });
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        boxShadow: theme.shadows[1],
        overflow: 'hidden'
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography
            variant="h6"
            sx={{
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

          {hasThumbnail && (
            <Tooltip
              title={copySuccess ? "Copied!" : "Copy image link"}
              arrow
              placement="top"
            >
              <IconButton
                size="small"
                onClick={handleCopyImageUrl}
                color={copySuccess ? "success" : "default"}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                {copySuccess ? (
                  <CheckCircleOutlineIcon fontSize="small" />
                ) : (
                  <LinkIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>

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
