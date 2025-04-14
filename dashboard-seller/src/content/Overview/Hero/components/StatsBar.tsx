import React from 'react';
import { Box, Typography, Divider, useMediaQuery, useTheme, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { itemVariants } from '../animations';
import { stats } from '../data';

export const StatsBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <motion.div variants={itemVariants}>
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          my: 4,
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          p: { xs: 2, sm: 0 }
        }}
      >
        {isMobile ? (
          // Mobile view (2x2 grid layout)
          <Grid container>
            {stats.map((stat, index) => (
              <Grid item xs={6} key={index} sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    height: '100%'
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '1.8rem' },
                      color: '#4169E1',
                      mb: 1,
                      lineHeight: 1.2
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      fontSize: { xs: '0.65rem', sm: '0.7rem' }
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Box
                    sx={{
                      width: '30%',
                      height: 2,
                      backgroundColor: '#4169E1',
                      mt: 2
                    }}
                  />
                </Box>
                
                {/* Add dividers between cells */}
                {index % 2 === 0 && index < stats.length - 1 && (
                  <Divider 
                    orientation="vertical" 
                    sx={{ 
                      position: 'absolute',
                      right: 0,
                      top: '15%',
                      height: '70%'
                    }} 
                  />
                )}
                {index < 2 && (
                  <Divider 
                    sx={{ 
                      width: '70%',
                      margin: '0 auto'
                    }} 
                  />
                )}
              </Grid>
            ))}
          </Grid>
        ) : (
          // Desktop view (horizontal layout)
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}
          >
            {stats.map((stat, index) => (
              <React.Fragment key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    textAlign: 'center',
                    flex: 1
                  }}
                >
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { sm: '1.8rem', md: '2.5rem' },
                      color: '#4169E1',
                      mb: 1,
                      lineHeight: 1.2
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      fontSize: { sm: '0.7rem', md: '0.8rem' }
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Box
                    sx={{
                      width: '30%',
                      height: 2,
                      backgroundColor: '#4169E1',
                      mt: 2
                    }}
                  />
                </Box>
                {index < stats.length - 1 && (
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                      my: 2
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        )}
      </Box>
    </motion.div>
  );
};
