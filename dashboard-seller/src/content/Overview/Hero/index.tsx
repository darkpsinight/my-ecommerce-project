import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useAppSelector } from 'src/redux/hooks';

import {
  MotionContainer,
  TypographyH1,
  TypographyH2,
  BackgroundDecoration,
  BackgroundDecorationLeft,
  BackgroundGrid
} from './HeroStyles';
import { containerVariants, itemVariants } from './animations';
import { testimonials, stats, features } from './data';
import { TestimonialSection } from './components/TestimonialSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { StatsBar } from './components/StatsBar';
import FinalCTA from './components/FinalCTA';
import CTAButton from './components/CTAButton';

function Hero() {
  const configs = useAppSelector((state) => state.config.data);
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
          pt: { xs: 3, sm: 4, md: 2 },
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
                    mb: 5,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' }
                  }}
                >
                  Welcome to {configs.APP_NAME}
                </TypographyH1>
              </motion.div>
              
              {/* CTA Button */}
              <CTAButton isAuthenticated={isAuthenticated} />
              
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

          <StatsBar />

          <FeaturesGrid features={features} />
          <TestimonialSection testimonials={testimonials} />

          {/* Final CTA Section */}
          <FinalCTA buyerBaseUrl={buyerBaseUrl} isAuthenticated={isAuthenticated} />
        </MotionContainer>
      </Container>
    </Box>
  );
}

export default Hero;
