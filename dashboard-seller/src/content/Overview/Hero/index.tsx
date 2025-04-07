import { Box, Button, Container, Grid, Typography, Stack, Paper, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAppSelector } from 'src/redux/hooks';

const TypographyH1 = styled(Typography)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(52)};
    font-weight: 800;
    background: linear-gradient(45deg, ${theme.colors.primary.dark} 0%, ${theme.colors.primary.main} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: ${theme.spacing(3)};
    transition: all 0.3s ease;
    letter-spacing: -0.5px;
    &:hover {
      transform: scale(1.02);
    }
`
);

const TypographyH2 = styled(Typography)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(18)};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
`
);

const FeatureCard = styled(Paper)(
  ({ theme }) => `
    width: 100%;
    padding: ${theme.spacing(4)};
    border-radius: ${theme.general.borderRadiusLg};
    background: ${theme.colors.alpha.white[0.97]};
    color: ${theme.colors.alpha.black[100]};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
    border: 1px solid ${theme.colors.alpha.black[5]};
    text-align: center;
    height: 100%;
    position: relative;
    overflow: hidden;
    z-index: 1;

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
      box-shadow: 0 12px 28px rgba(0,0,0,0.15);
      border-color: ${theme.colors.primary.light};
      
      &::before {
        height: 6px;
      }
    }
`
);

const FeatureIcon = styled(Box)(
  ({ theme }) => `
    width: ${theme.spacing(10)};
    height: ${theme.spacing(10)};
    border-radius: 50%;
    background: linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%);
    color: ${theme.colors.alpha.white[100]};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto ${theme.spacing(3)};
    transition: all 0.4s ease;
    box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid ${theme.colors.primary.lighter};
      top: 0;
      left: 0;
      opacity: 0;
      transform: scale(1.2);
      transition: all 0.4s ease;
    }

    .MuiSvgIcon-root {
      font-size: ${theme.typography.pxToRem(36)};
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    &:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 8px 20px rgba(33, 150, 243, 0.5);
      
      &::after {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }
`
);

// Background decoration components
const BackgroundDecoration = styled(Box)(
  ({ theme }) => `
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${theme.colors.primary.lighter} 0%, ${theme.colors.primary.light} 100%);
    top: -150px;
    right: -150px;
    opacity: 0.15;
    z-index: 0;
    animation: pulse 15s infinite ease-in-out;
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
`
);

const BackgroundDecorationLeft = styled(Box)(
  ({ theme }) => `
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%);
    bottom: -150px;
    left: -150px;
    opacity: 0.1;
    z-index: 0;
    animation: pulse2 20s infinite ease-in-out;
    
    @keyframes pulse2 {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
`
);

function Hero() {
  const { data: configs } = useAppSelector((state) => state.config);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <BackgroundDecoration />
      <BackgroundDecorationLeft />
      <Container maxWidth="lg" sx={{ textAlign: 'center', position: 'relative', zIndex: 2, py: { xs: 2, sm: 3, md: 4 } }}>
      <Grid
        spacing={{ xs: 2, sm: 3, md: 4 }}
        justifyContent="center"
        alignItems="center"
        container
        sx={{ px: { xs: 0, sm: 1 } }}
      >
        <Grid item xs={12} md={10} lg={8} mx="auto" sx={{ position: 'relative' }}>
          <TypographyH1 sx={{ mb: 1, fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' } }} variant="h1">
            Welcome to <span style={{ color: '#2196F3' }}>{configs.APP_NAME}</span>
          </TypographyH1>
          <TypographyH2
            sx={{ 
              lineHeight: 1.4, 
              pb: 2,
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem' },
              px: { xs: 0, sm: 0 }
            }}
            variant="h4"
            color="text.secondary"
            fontWeight="normal"
          >
            Your trusted platform for selling digital codes, game keys, and software licenses.
            Start managing your digital inventory today!
          </TypographyH2>
          <Divider sx={{ width: '600px', mx: 'auto', mb: 4, borderColor: 'primary.light', opacity: 0.6 }} />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2, sm: 3 }}
            justifyContent="center"
            sx={{ mb: { xs: 6, sm: 8, md: 10 }, width: '100%' }}
          >
            <Button
              component={RouterLink}
              to="/login"
              size="large"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 2,
                px: 4,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 4px 10px rgba(33, 203, 243, .4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 15px rgba(33, 203, 243, .5)',
                }
              }}
            >
              Sign In to Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/dashboards/crypto"
              size="large"
              variant="outlined"
              sx={{
                py: 2,
                px: 4,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 500,
                borderWidth: '2px',
                borderColor: 'primary.main',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.dark',
                  background: 'rgba(33, 150, 243, 0.04)',
                  transform: 'translateY(-3px)',
                }
              }}
            >
              Dashboard
            </Button>
          </Stack>

          <Grid container spacing={{ xs: 3, sm: 4, md: 5 }} mt={2}>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FeatureCard sx={{ height: '100%' }}>
                <FeatureIcon>
                  <StorefrontIcon />
                </FeatureIcon>
                <Typography variant="h4" sx={{ pb: 1, fontWeight: 700, letterSpacing: '-0.5px', fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                  Digital Marketplace
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 1, fontWeight: 600, letterSpacing: '0.5px' }}>
                  1,240+ Products
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  List and manage your digital products with ease. Support for game keys, software licenses, and more.
                </Typography>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FeatureCard sx={{ height: '100%' }}>
                <FeatureIcon>
                  <SecurityIcon />
                </FeatureIcon>
                <Typography variant="h4" sx={{ pb: 1, fontWeight: 700, letterSpacing: '-0.5px', fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                  Secure Platform
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 1, fontWeight: 600, letterSpacing: '0.5px' }}>
                  99.9% Uptime
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Advanced security measures to protect your inventory and transactions.
                </Typography>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FeatureCard sx={{ height: '100%' }}>
                <FeatureIcon>
                  <AnalyticsIcon />
                </FeatureIcon>
                <Typography variant="h4" sx={{ pb: 1, fontWeight: 700, letterSpacing: '-0.5px', fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                  Sales Analytics
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 1, fontWeight: 600, letterSpacing: '0.5px' }}>
                  30+ Metrics
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Track your performance with detailed analytics and sales reports.
                </Typography>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: '100%' }}>
              <FeatureCard sx={{ height: '100%' }}>
                <FeatureIcon>
                  <SupportAgentIcon />
                </FeatureIcon>
                <Typography variant="h4" sx={{ pb: 1, fontWeight: 700, letterSpacing: '-0.5px', fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
                  24/7 Support
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 1, fontWeight: 600, letterSpacing: '0.5px' }}>
                  5 Min Response
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Our dedicated support team is always here to help you succeed.
                </Typography>
              </FeatureCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
    </Box>
  );
}

export default Hero;
