import React from 'react';
import { Stack, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PrimaryButton } from '../HeroStyles';
import { itemVariants } from '../animations';

interface CTAButtonProps {
  isAuthenticated: boolean;
}

export const CTAButton: React.FC<CTAButtonProps> = ({ isAuthenticated }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <motion.div variants={itemVariants} style={{ width: '100%' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2, sm: 3 }}
        justifyContent="center"
        alignItems="center"
        sx={{ mb: { xs: 3, sm: 4 }, width: '100%' }}
      >
        {isAuthenticated ? (
          <PrimaryButton
            component={RouterLink}
            to="/dashboards/crypto"
            size="small"
            variant="contained"
            endIcon={<ArrowForwardIcon fontSize={isMobile ? "small" : "medium"} />}
            sx={{
              fontSize: isMobile ? '1.2rem' : isTablet ? '1.4rem' : '1.6rem',
              padding: isMobile ? '14px 16px' : isTablet ? '14px 30px' : '16px 36px',
              width: isMobile ? 'auto' : isTablet ? '350px' : 'auto',
              minWidth: isMobile ? '280px' : undefined,
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
              boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                boxShadow: '0 12px 20px rgba(33, 150, 243, 0.4)',
                transform: 'translateY(-2px)'
              },
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shine 1.5s infinite'
              },
              '@keyframes shine': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' }
              }
            }}
          >
            Access your Dashboard
          </PrimaryButton>
        ) : (
          <PrimaryButton
            component={RouterLink}
            to="/login"
            size="large"
            variant="contained"
            endIcon={<ArrowForwardIcon fontSize={isMobile ? "small" : "medium"} />}
            sx={{
              fontSize: isMobile ? '1.2rem' : isTablet ? '1.6rem' : '1.8rem',
              padding: isMobile ? '14px 20px' : isTablet ? '14px 30px' : '16px 36px',
              width: isMobile ? '100%' : isTablet ? '350px' : 'auto',
              maxWidth: isMobile ? '90%' : '100%',
              whiteSpace: 'nowrap',
            }}
          >
            Sign In to Dashboard
          </PrimaryButton>
        )}
      </Stack>
    </motion.div>
  );
};

export default CTAButton;