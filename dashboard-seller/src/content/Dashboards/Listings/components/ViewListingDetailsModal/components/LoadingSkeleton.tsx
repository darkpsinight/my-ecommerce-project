import React from 'react';
import { Box, DialogContent, Grid, Skeleton } from '@mui/material';

const LoadingSkeleton: React.FC = () => {
  return (
    <DialogContent
      sx={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        p: 4
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 500 }}>
        <Skeleton
          variant="text"
          sx={{ height: 40, mb: 1, borderRadius: 1 }}
        />
        <Skeleton
          variant="text"
          sx={{ height: 24, width: '60%', mb: 3, borderRadius: 1 }}
        />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 1 }}
            />
          </Grid>
          <Grid item xs={6}>
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 1 }}
            />
          </Grid>
        </Grid>

        <Skeleton
          variant="text"
          sx={{ height: 32, mb: 1, borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          height={100}
          sx={{ borderRadius: 1 }}
        />
      </Box>
    </DialogContent>
  );
};

export default LoadingSkeleton;
