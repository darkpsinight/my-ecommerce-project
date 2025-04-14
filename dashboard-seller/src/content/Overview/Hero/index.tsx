import React from 'react';
import { Box, Container, Grid, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAppSelector } from 'src/redux/hooks';

import {
  MotionContainer,
  TypographyH1,
  TypographyH2,
  BackgroundDecoration,
  BackgroundDecorationLeft,
  BackgroundGrid,
  PrimaryButton,
} from './HeroStyles';
import { containerVariants, itemVariants } from './animations';
import { testimonials, stats, features } from './data';
import { TestimonialSection } from './components/TestimonialSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { StatsBar } from './components/StatsBar';

function Hero() {
  const { data: configs } = useAppSelector((state) => state.config);
  const buyerBaseUrl = process.env.REACT_APP_BUYER_BASE_URL;
  const { token } = useAppSelector((state) => state.auth);
  const isAuthenticated = !!token;

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', pb: 8 }}>
      <BackgroundDecoration />
      <BackgroundDecorationLeft />
      <BackgroundGrid />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 2,
          pt: { xs: 6, sm: 8, md: 10 },
          pb: 2
        }}
      >
        <MotionContainer
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Grid
            container
            spacing={{ xs: 2, sm: 3, md: 4 }}
            justifyContent="center"
            alignItems="center"
          >
            <Grid item xs={12} md={10} lg={8} sx={{ textAlign: 'center' }}>
              <motion.div variants={itemVariants}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    letterSpacing: 1,
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(33, 150, 243, 0.1)'
                        : 'rgba(33, 150, 243, 0.08)',
                    py: 0.8,
                    px: 2,
                    borderRadius: 5,
                    mb: 3,
                    display: 'inline-block',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem'
                  }}
                >
                  Digital Marketplace Platform
                </Typography>
              </motion.div>

              <motion.div variants={itemVariants}>
                <TypographyH1
                  variant="h1"
                  sx={{
                    mb: 3,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' }
                  }}
                >
                  Welcome to{' '}
                  <span style={{ color: '#2196F3' }}>{configs.APP_NAME}</span>
                </TypographyH1>
              </motion.div>

              <motion.div variants={itemVariants}>
                <TypographyH2
                  variant="h4"
                  sx={{
                    lineHeight: 1.6,
                    fontWeight: 'normal',
                    fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
                  }}
                >
                  Your trusted platform for selling digital codes, game keys,
                  and software licenses. Take control of your digital inventory
                  with our advanced tools.
                </TypographyH2>
              </motion.div>
            </Grid>
          </Grid>

          <StatsBar stats={stats} />

          {/* CTA Buttons */}
          <motion.div variants={itemVariants}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 2, sm: 3 }}
              justifyContent="center"
              sx={{ mb: { xs: 6, sm: 8 }, width: '100%' }}
            >
              {isAuthenticated ? (
                <PrimaryButton
                  component={RouterLink}
                  to="/dashboards/crypto"
                  size="large"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                >
                  Explore Features
                </PrimaryButton>
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

          <FeaturesGrid features={features} />
          <TestimonialSection testimonials={testimonials} />

          {/* Final CTA */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{
                mt: 8,
                pt: 6,
                pb: 6,
                textAlign: 'center',
                borderRadius: 4,
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.colors.primary.lighter} 0%, ${theme.colors.primary.light} 100%)`,
                boxShadow: '0 8px 32px rgba(33, 150, 243, 0.15)',
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
                    color: 'primary.dark'
                  }}
                >
                  Ready to get started?
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 4,
                    maxWidth: 600,
                    mx: 'auto',
                    color: 'text.primary',
                    padding: 2
                  }}
                >
                  Join thousands of digital sellers who are growing their
                  business with our platform
                </Typography>
                <PrimaryButton
                  component="a"
                  href={`${buyerBaseUrl}/sell-digital-codes`}
                  size="large"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 4 }}
                >
                  Become a Seller
                </PrimaryButton>
              </Box>

              {/* Background patterns */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  opacity: 0.5,
                  zIndex: 1
                }}
              />
            </Box>
          </motion.div>
        </MotionContainer>
      </Container>
    </Box>
  );
}

export default Hero;
