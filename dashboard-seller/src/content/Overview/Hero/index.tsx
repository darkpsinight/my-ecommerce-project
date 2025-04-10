import React from 'react';
import { Box, Button, Container, Grid, Typography, Stack, Paper, Divider, Avatar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import { useAppSelector } from 'src/redux/hooks';
import { ButtonProps as MuiButtonProps } from '@mui/material/Button';

interface ButtonProps extends MuiButtonProps {
  component?: React.ElementType;
  to?: string;
}

// Animated components with Framer Motion
const MotionContainer = styled(motion.div)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const TypographyH1 = styled(Typography)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(54)};
    font-weight: 900;
    background: linear-gradient(45deg, ${theme.colors.primary.dark} 0%, ${theme.colors.primary.main} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 8px rgba(0,0,0,0.12);
    margin-bottom: ${theme.spacing(2)};
    letter-spacing: -0.5px;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, ${theme.colors.primary.main}, transparent);
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 4px;
    }
`
);

const TypographyH2 = styled(Typography)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(20)};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
    color: ${theme.colors.alpha.black[70]};
`
);

const FeatureCard = styled(Paper)(
  ({ theme }) => `
    width: 100%;
    padding: ${theme.spacing(4)};
    border-radius: ${theme.general.borderRadiusXl};
    background: ${theme.palette.mode === 'dark' ? theme.colors.alpha.black[10] : theme.colors.alpha.white[100]};
    color: ${theme.colors.alpha.black[100]};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    border: 1px solid ${theme.colors.alpha.black[5]};
    text-align: center;
    height: 100%;
    position: relative;
    overflow: hidden;
    z-index: 1;
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%);
      opacity: 0.8;
      transition: height 0.3s ease;
      z-index: -1;
    }

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 32px rgba(0,0,0,0.12);
      border-color: ${theme.colors.primary.lighter};
      
      &::before {
        height: 6px;
      }
    }
`
);

const FeatureIcon = styled(Box)(
  ({ theme }) => `
    width: ${theme.spacing(12)};
    height: ${theme.spacing(12)};
    border-radius: 20px;
    background: linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%);
    color: ${theme.colors.alpha.white[100]};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto ${theme.spacing(3)};
    transition: all 0.4s ease;
    box-shadow: 0 10px 20px rgba(33, 150, 243, 0.3);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 20px;
      border: 2px solid ${theme.colors.primary.lighter};
      top: 0;
      left: 0;
      opacity: 0;
      transform: scale(1.2);
      transition: all 0.4s ease;
    }

    .MuiSvgIcon-root {
      font-size: ${theme.typography.pxToRem(38)};
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    &:hover {
      transform: scale(1.05) rotate(2deg);
      box-shadow: 0 12px 24px rgba(33, 150, 243, 0.4);
      border-radius: 16px;
      
      &::after {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }
`
);

// New testimonial section
const TestimonialCard = styled(Paper)(
  ({ theme }) => `
    padding: ${theme.spacing(4)};
    border-radius: ${theme.general.borderRadius};
    background: ${theme.colors.alpha.white[100]};
    border: 1px solid ${theme.colors.alpha.black[10]};
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    position: relative;
    transition: all 0.2s;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    &::before {
      content: '"';
      position: absolute;
      top: 8px;
      left: 16px;
      font-size: 60px;
      color: ${theme.colors.primary.lighter};
      font-family: Georgia, serif;
      opacity: 0.3;
    }
`
);

// Background decoration components with improved styling
const BackgroundDecoration = styled(Box)(
  ({ theme }) => `
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${theme.colors.primary.lighter} 0%, ${theme.colors.primary.light} 100%);
    top: -200px;
    right: -200px;
    opacity: 0.08;
    z-index: 0;
    animation: pulse 20s infinite ease-in-out;
    
    @keyframes pulse {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.1) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
`
);

const BackgroundDecorationLeft = styled(Box)(
  ({ theme }) => `
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.secondary.main} 100%);
    bottom: -200px;
    left: -200px;
    opacity: 0.07;
    z-index: 0;
    animation: pulse2 25s infinite ease-in-out;
    
    @keyframes pulse2 {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.15) rotate(-5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
`
);

const BackgroundGrid = styled(Box)(
  ({ theme }) => `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(${theme.colors.primary.lighter} 1px, transparent 1px),
                      linear-gradient(90deg, ${theme.colors.primary.lighter} 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
    opacity: 0.015;
    z-index: 0;
    pointer-events: none;
`
);

// New statistics section
const StatBox = styled(Box)(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${theme.spacing(2, 0)};
    
    .stat-value {
      font-size: ${theme.typography.pxToRem(36)};
      font-weight: 800;
      color: ${theme.colors.primary.main};
      margin-bottom: ${theme.spacing(0.5)};
      background: linear-gradient(45deg, ${theme.colors.primary.dark} 0%, ${theme.colors.primary.main} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .stat-label {
      font-size: ${theme.typography.pxToRem(14)};
      color: ${theme.colors.alpha.black[70]};
      text-transform: uppercase;
      letter-spacing: 1px;
    }
`
);

// Custom styled buttons that support RouterLink
const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 16px rgba(0, 0, 0, 0.15)`,
  },
}));

const PrimaryButton = styled(StyledButton)<ButtonProps>(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%)`,
  color: theme.colors.alpha.white[100],
}));

const SecondaryButton = styled(StyledButton)<ButtonProps>(({ theme }) => ({
  background: theme.colors.alpha.white[100],
  color: theme.colors.primary.main,
  '&:hover': {
    background: theme.colors.alpha.white[90],
  },
}));

// Animation variants for staggered children animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

function Hero() {
  const { data: configs } = useAppSelector((state) => state.config);

  const testimonials = [
    {
      id: 1,
      name: "Alex Johnson",
      title: "Game Developer",
      avatar: "/static/images/avatars/1.jpg",
      content: "This platform revolutionized how I distribute my indie games. The analytics are comprehensive and the payment processing is seamless."
    },
    {
      id: 2,
      name: "Sarah Chen",
      title: "Software Entrepreneur",
      avatar: "/static/images/avatars/2.jpg",
      content: "After trying multiple platforms, this is the only one that offers the security and ease of use I needed for my digital products."
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "1,240+", label: "Products" },
    { value: "24/7", label: "Support" },
    { value: "128+", label: "Countries" }
  ];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', pb: 8 }}>
      <BackgroundDecoration />
      <BackgroundDecorationLeft />
      <BackgroundGrid />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, pt: { xs: 6, sm: 8, md: 10 }, pb: 2 }}>
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
                    backgroundColor: theme => theme.palette.mode === 'dark' 
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
                  Welcome to <span style={{ color: '#2196F3' }}>{configs.APP_NAME}</span>
                </TypographyH1>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <TypographyH2
                  variant="h4"
                  sx={{ 
                    lineHeight: 1.6, 
                    mb: 4,
                    fontWeight: 'normal',
                    fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                    pb: 2
                  }}
                >
                  Your trusted platform for selling digital codes, game keys, and software licenses.
                  Take control of your digital inventory with our advanced tools.
                </TypographyH2>
              </motion.div>
            </Grid>
          </Grid>
          
          {/* Statistics Bar */}
          <motion.div variants={itemVariants}>
            <Box
              sx={{ 
                maxWidth: 800, 
                mx: 'auto', 
                my: 4, 
                py: 2,
                px: { xs: 2, sm: 4 },
                borderRadius: 3,
                backgroundColor: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                border: theme => `1px solid ${theme.colors.alpha.black[10]}`
              }}
            >
              <Grid container>
                {stats.map((stat, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <StatBox>
                      <Typography className="stat-value">{stat.value}</Typography>
                      <Typography className="stat-label">{stat.label}</Typography>
                    </StatBox>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>
          
          {/* CTA Buttons */}
          <motion.div variants={itemVariants}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 2, sm: 3 }}
              justifyContent="center"
              sx={{ mb: { xs: 6, sm: 8 }, width: '100%' }}
            >
              <PrimaryButton
                component={RouterLink}
                to="/login"
                size="large"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                Sign In to Dashboard
              </PrimaryButton>
              <SecondaryButton
                component={RouterLink}
                to="/dashboards/crypto"
                size="large"
                variant="outlined"
                sx={{ ml: 2 }}
              >
                Explore Features
              </SecondaryButton>
            </Stack>
          </motion.div>
          
          {/* Feature Grid */}
          <Grid container spacing={{ xs: 3, sm: 4, md: 5 }} sx={{ mt: 4 }}>
            {[
              {
                icon: <StorefrontIcon />,
                title: "Digital Marketplace",
                metric: "1,240+ Products",
                description: "List and manage your digital products with ease. Support for game keys, software licenses, and more."
              },
              {
                icon: <SecurityIcon />,
                title: "Enterprise Security",
                metric: "99.9% Uptime",
                description: "Advanced security measures to protect your inventory and transactions with full encryption."
              },
              {
                icon: <AnalyticsIcon />,
                title: "Advanced Analytics",
                metric: "30+ Metrics",
                description: "Track your performance with detailed analytics, sales reports, and customer insights."
              },
              {
                icon: <SupportAgentIcon />,
                title: "Priority Support",
                metric: "5 Min Response",
                description: "Our dedicated support team is always here to help you succeed with your digital business."
              }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <motion.div variants={itemVariants}>
                  <FeatureCard>
                    <FeatureIcon>
                      {feature.icon}
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
          
          {/* Testimonials Section */}
          <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
            <motion.div variants={itemVariants}>
              <Typography 
                variant="h3" 
                sx={{ 
                  mb: 1, 
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
                }}
              >
                What Our Sellers Say
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="textSecondary"
                sx={{ 
                  mb: 4, 
                  mx: 'auto', 
                  maxWidth: 700
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
                        color="textSecondary"
                        sx={{ 
                          mb: 3, 
                          fontStyle: 'italic',
                          pl: 3
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
                            border: theme => `2px solid ${theme.colors.primary.lighter}`
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {testimonial.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
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
          
          {/* Final CTA */}
          <motion.div variants={itemVariants}>
            <Box 
              sx={{ 
                mt: 8, 
                pt: 6, 
                pb: 6, 
                textAlign: 'center',
                borderRadius: 4,
                background: theme => 
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
                    color: 'text.primary'
                  }}
                >
                  Join thousands of digital sellers who are growing their business with our platform
                </Typography>
                <PrimaryButton
                  component={RouterLink}
                  to="/register"
                  size="large"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 4 }}
                >
                  Create Your Account
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
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
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