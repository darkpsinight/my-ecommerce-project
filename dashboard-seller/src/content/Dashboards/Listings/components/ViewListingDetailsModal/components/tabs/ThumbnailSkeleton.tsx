import React from 'react';
import {
  Box,
  Skeleton,
  Typography,
  useTheme,
  alpha
} from '@mui/material';

interface ThumbnailSkeletonProps {
  hasThumbnail: boolean;
}

const ThumbnailSkeleton: React.FC<ThumbnailSkeletonProps> = ({ hasThumbnail }) => {
  const theme = useTheme();

  return (
    <>
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
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{
              maxWidth: '100%',
              width: '100%',
              height: 300,
              maxHeight: 300,
              borderRadius: 1
            }}
          />
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Skeleton
            variant="text"
            width="60%"
            height={24}
            sx={{ mb: 1, mx: 'auto' }}
            animation="wave"
          />
          <Skeleton
            variant="text"
            width="80%"
            height={20}
            sx={{ mx: 'auto' }}
            animation="wave"
          />
        </Box>
      )}
    </>
  );
};

export default ThumbnailSkeleton;
