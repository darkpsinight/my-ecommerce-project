import React from 'react';
import { Box, Grid, Typography, Stack, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import PersonIcon from '@mui/icons-material/Person';
import { TestimonialCard } from '../HeroStyles';
import { Testimonial } from '../types';
import { itemVariants } from '../animations';

interface TestimonialSectionProps {
  testimonials: Testimonial[];
}

export const TestimonialSection: React.FC<TestimonialSectionProps> = ({ testimonials }) => {
  return (
    <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
      <motion.div variants={itemVariants}>
        <Typography
          variant="h3"
          sx={{
            mb: 1,
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
            color: theme => theme.palette.mode === 'dark'
              ? theme.colors.alpha.white[100]
              : theme.colors.alpha.black[100]
          }}
        >
          What Our Sellers Say
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            mb: 4,
            mx: 'auto',
            maxWidth: 700,
            color: theme => theme.palette.mode === 'dark'
              ? theme.colors.alpha.white[70]
              : theme.colors.alpha.black[70]
          }}
        >
          Join thousands of satisfied sellers who have transformed their digital business
        </Typography>
      </motion.div>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {testimonials.map((testimonial) => (
          <Grid item xs={12} md={6} key={testimonial.id}>
            <motion.div variants={itemVariants}>
              <TestimonialCard>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    fontStyle: 'italic',
                    pl: 3,
                    color: theme => theme.palette.mode === 'dark'
                      ? theme.colors.alpha.white[70]
                      : theme.colors.alpha.black[70]
                  }}
                >
                  "{testimonial.content}"
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    sx={{
                      width: 48,
                      height: 48,
                      border: theme => `2px solid ${
                        theme.palette.mode === 'dark'
                          ? theme.colors.primary.main
                          : theme.colors.primary.lighter
                      }`
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{
                        color: theme => theme.palette.mode === 'dark'
                          ? theme.colors.alpha.white[100]
                          : theme.colors.alpha.black[100]
                      }}
                    >
                      {testimonial.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme => theme.palette.mode === 'dark'
                          ? theme.colors.alpha.white[50]
                          : theme.colors.alpha.black[50]
                      }}
                    >
                      {testimonial.title}
                    </Typography>
                  </Box>
                </Stack>
              </TestimonialCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};