import React from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuthRefresh } from 'src/hooks/useAuthRefresh';

const GlobalAuthLoader: React.FC = () => {
  const { isRefreshing } = useAuthRefresh();

  if (!isRefreshing) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <Fade in={true} timeout={800}>
        <Box sx={{ mb: 3 }}>
          <CircularProgress size={56} thickness={4.5} color="primary" />
        </Box>
      </Fade>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom textAlign="center">
          Preparing your dashboard…
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" textAlign="center">
          Securely checking your session. Please wait a moment.
        </Typography>
      </motion.div>
    </Box>
  );
};

export default GlobalAuthLoader;
