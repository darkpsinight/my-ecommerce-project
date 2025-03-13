import { Box, Button, Container, Grid, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useEffect, useState } from 'react';
import { getPublicConfigs } from 'src/services/config';

const TypographyH1 = styled(Typography)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(50)};
    background: linear-gradient(45deg, ${theme.colors.primary.dark} 0%, ${theme.colors.primary.main} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`
);

const TypographyH2 = styled(Typography)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(17)};
`
);

const FeatureIcon = styled(Box)(
  ({ theme }) => `
    width: ${theme.spacing(8)};
    height: ${theme.spacing(8)};
    border-radius: ${theme.general.borderRadius};
    background: ${theme.colors.primary.lighter};
    color: ${theme.colors.primary.main};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto ${theme.spacing(2)};
    transition: all .2s;

    .MuiSvgIcon-root {
      font-size: ${theme.typography.pxToRem(32)};
    }

    &:hover {
      background: ${theme.colors.primary.main};
      color: ${theme.colors.alpha.white[100]};
      transform: translateY(-5px);
    }
`
);

function Hero() {
  const [appName, setAppName] = useState('');

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const configs = await getPublicConfigs();
        setAppName(configs.APP_NAME);
      } catch (error) {
        console.error('Error fetching app name:', error);
      }
    };

    fetchConfigs();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
      <Grid
        spacing={{ xs: 6, md: 10 }}
        justifyContent="center"
        alignItems="center"
        container
      >
        <Grid item md={10} lg={8} mx="auto">
          <TypographyH1 sx={{ mb: 2 }} variant="h1">
            Welcome to {appName}
          </TypographyH1>
          <TypographyH2
            sx={{ lineHeight: 1.5, pb: 4 }}
            variant="h4"
            color="text.secondary"
            fontWeight="normal"
          >
            Your trusted platform for selling digital codes, game keys, and software licenses.
            Start managing your digital inventory today!
          </TypographyH2>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 8 }}
          >
            <Button
              component={RouterLink}
              to="/login"
              size="large"
              variant="contained"
              sx={{
                py: 2,
                px: 4,
                borderRadius: 2,
                fontSize: '1.1rem',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
                }
              }}
            >
              Sign In to Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              size="large"
              variant="outlined"
              sx={{
                py: 2,
                px: 4,
                borderRadius: 2,
                fontSize: '1.1rem'
              }}
            >
              Create Seller Account
            </Button>
          </Stack>

          <Grid container spacing={4} mt={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FeatureIcon>
                <StorefrontIcon />
              </FeatureIcon>
              <Typography variant="h4" sx={{ pb: 2 }}>
                Digital Marketplace
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                List and manage your digital products with ease. Support for game keys, software licenses, and more.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FeatureIcon>
                <SecurityIcon />
              </FeatureIcon>
              <Typography variant="h4" sx={{ pb: 2 }}>
                Secure Platform
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Advanced security measures to protect your inventory and transactions.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FeatureIcon>
                <AnalyticsIcon />
              </FeatureIcon>
              <Typography variant="h4" sx={{ pb: 2 }}>
                Sales Analytics
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Track your performance with detailed analytics and sales reports.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FeatureIcon>
                <SupportAgentIcon />
              </FeatureIcon>
              <Typography variant="h4" sx={{ pb: 2 }}>
                24/7 Support
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Our dedicated support team is always here to help you succeed.
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Hero;
