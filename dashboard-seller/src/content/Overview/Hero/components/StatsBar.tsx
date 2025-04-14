import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { StatBox } from '../HeroStyles';
import { Stat } from '../types';
import { itemVariants } from '../animations';
import AnimatedCounter from './AnimatedCounter';

interface StatsBarProps {
  stats: Stat[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <motion.div variants={itemVariants}>
      <Box
        sx={{ 
          maxWidth: 900, 
          mx: 'auto', 
          my: 4, 
          py: 3,
          px: { xs: 3, sm: 4 },
          borderRadius: 3,
          backgroundColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.03)' 
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          border: theme => `1px solid ${theme.colors.alpha.black[10]}`
        }}
      >
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <StatBox>
                <AnimatedCounter value={stat.value} className="stat-value" />
                <Typography className="stat-label">{stat.label}</Typography>
              </StatBox>
            </Grid>
          ))}
        </Grid>
      </Box>
    </motion.div>
  );
}; 