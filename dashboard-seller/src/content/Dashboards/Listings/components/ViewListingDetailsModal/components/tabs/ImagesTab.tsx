import React, { useState, useEffect } from 'react';
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
import ThumbnailSkeleton from './ThumbnailSkeleton';

interface ImagesTabProps {
  listing: Listing;
}

const ImagesTab: React.FC<ImagesTabProps> = ({ listing }) => {
  const theme = useTheme();
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);

  const hasThumbnail = listing.thumbnailUrl && listing.thumbnailUrl.trim() !== '';

  // Show skeleton loader when the component first mounts
  useEffect(() => {
    // Set initial loading state
    setIsLoading(true);
    setImageError(false);

    // If there's no thumbnail, we don't need to load anything
    if (!hasThumbnail) {
      setIsLoading(false);
      return;
    }

    // Preload the image to handle the loading state properly
    if (listing.thumbnailUrl) {
      const img = new Image();
      img.src = listing.thumbnailUrl;

      img.onload = () => {
        setIsLoading(false);
      };

      img.onerror = () => {
        setIsLoading(false);
        setImageError(true);
      };
    }
  }, [listing.thumbnailUrl, hasThumbnail]);

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

        {isLoading ? (
          // Show skeleton loader while image is loading
          <ThumbnailSkeleton hasThumbnail={hasThumbnail} />
        ) : hasThumbnail ? (
          // Show actual image when loaded
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
            {imageError ? (
              // Show error message if image fails to load
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography
                  variant="body1"
                  color="error"
                  sx={{ mb: 1 }}
                >
                  Failed to load thumbnail image.
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                >
                  The image URL may be invalid or inaccessible.
                </Typography>
              </Box>
            ) : (
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
            )}
          </Box>
        ) : (
          // Show message when no thumbnail is available
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
