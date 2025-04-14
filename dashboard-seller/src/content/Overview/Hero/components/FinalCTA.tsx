import React from 'react';
import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { PrimaryButton } from '../HeroStyles';
import { itemVariants } from '../animations';

interface FinalCTAProps {
  buyerBaseUrl: string;
  isAuthenticated: boolean;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ buyerBaseUrl, isAuthenticated }) => {
  return (
    <motion.div variants={itemVariants}>
      <Box
        sx={{
          mt: 8,
          pt: 6,
          pb: 6,
          textAlign: 'center',
          borderRadius: 16,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)'
              : 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(33, 150, 243, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography
            variant="h3"
            sx={{
              mb: 2,
              fontWeight: 700,
              color: 'primary.main'
            }}
          >
            Ready to grow your digital business?
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              mb: 4,
              maxWidth: 700,
              mx: 'auto',
              color: 'text.primary',
              padding: 2,
              fontSize: '1.1rem'
            }}
          >
            Join thousands of digital sellers who have increased their
            revenue and streamlined their operations using our
            professional platform.
          </Typography>

          {isAuthenticated ? (
            <PrimaryButton
              component={RouterLink}
              to="/dashboards/crypto"
              size="large"
              variant="contained"
              startIcon={<DashboardIcon />}
              sx={{
                mt: 4,
                fontWeight: 600,
                borderRadius: '8px',
                padding: '12px 28px',
                background:
                  'linear-gradient(135deg, #1565C0 0%, #1976d2 100%)'
              }}
            >
              Access Your Dashboard
            </PrimaryButton>
          ) : (
            <PrimaryButton
              component="a"
              href={`${buyerBaseUrl}/sell-digital-codes`}
              size="large"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                mt: 4,
                fontWeight: 600,
                borderRadius: '8px',
                padding: '12px 28px'
              }}
            >
              Become a Seller
            </PrimaryButton>
          )}
        </Box>

        {/* Background patterns */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.05,
            background: 'url(/static/images/patterns/grid.svg)'
          }}
        />
      </Box>
    </motion.div>
  );
};

export default FinalCTA;
