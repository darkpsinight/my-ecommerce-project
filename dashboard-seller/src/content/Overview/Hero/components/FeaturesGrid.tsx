import React from 'react';
import { Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { FeatureCard, FeatureIcon } from '../HeroStyles';
import { Feature } from '../types';
import { itemVariants } from '../animations';
import { FeatureIcons } from './FeatureIcons';

interface FeaturesGridProps {
  features: Feature[];
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ features }) => {
  return (
    <Grid container spacing={{ xs: 3, sm: 4, md: 5 }} sx={{ mt: 4 }}>
      {features.map((feature, index) => (
        <Grid item xs={12} sm={6} key={index}>
          <motion.div variants={itemVariants}>
            <FeatureCard>
              <FeatureIcon>
                {FeatureIcons[feature.iconKey]}
              </FeatureIcon>
              <Typography 
                variant="h4" 
                sx={{ 
                  pb: 1, 
                  fontWeight: 700, 
                  letterSpacing: '-0.5px',
                  fontSize: { xs: '1.5rem', sm: '1.75rem' } 
                }}
              >
                {feature.title}
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'primary.main', 
                  mb: 1, 
                  fontWeight: 600, 
                  letterSpacing: '0.5px',
                  display: 'inline-block',
                  px: 2,
                  py: 0.5,
                  borderRadius: 10,
                  backgroundColor: theme => theme.palette.mode === 'dark' 
                    ? 'rgba(33, 150, 243, 0.1)' 
                    : 'rgba(33, 150, 243, 0.08)'
                }}
              >
                {feature.metric}
              </Typography>
              <Typography 
                variant="body1" 
                color="textSecondary" 
                sx={{ 
                  lineHeight: 1.6, 
                  mt: 1,
                  fontSize: { xs: '0.9rem', sm: '1rem' } 
                }}
              >
                {feature.description}
              </Typography>
            </FeatureCard>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
}; 