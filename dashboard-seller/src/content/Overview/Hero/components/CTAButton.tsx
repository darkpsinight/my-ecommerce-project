import React from 'react';
import { Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PrimaryButton } from '../HeroStyles';
import { itemVariants } from '../animations';

interface CTAButtonProps {
  isAuthenticated: boolean;
}

export const CTAButton: React.FC<CTAButtonProps> = ({ isAuthenticated }) => {
  return (
    <motion.div variants={itemVariants}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2, sm: 3 }}
        justifyContent="center"
        sx={{ mb: { xs: 6, sm: 8 }, width: '100%' }}
      >
        {isAuthenticated ? (
          <>
            <PrimaryButton
              component={RouterLink}
              to="/dashboards/crypto"
              size="large"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                fontSize: '1.1rem',
                padding: '12px 24px',
                background:
                  'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
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
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'shine 1.5s infinite'
                },
                '@keyframes shine': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                }
              }}
            >
              Go to Dashboard
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton
            component={RouterLink}
            to="/login"
            size="large"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
          >
            Sign In to Dashboard
          </PrimaryButton>
        )}
      </Stack>
    </motion.div>
  );
};

export default CTAButton;
