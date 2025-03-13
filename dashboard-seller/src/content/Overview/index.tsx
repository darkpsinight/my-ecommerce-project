import { Box, Container, Card } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { styled } from '@mui/material/styles';
import Logo from 'src/components/LogoSign';
import Hero from './Hero';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: auto;
    flex: 1;
    overflow-x: hidden;
    align-items: center;
    background: linear-gradient(135deg, ${theme.colors.primary.dark} 0%, ${theme.colors.primary.main} 60%);
    min-height: 100vh;
`
);

function Overview() {
  return (
    <OverviewWrapper>
      <Helmet>
        <title>DigitalMarket - Seller Dashboard</title>
      </Helmet>
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" py={5} alignItems="center">
          <Logo />
        </Box>
        <Card 
          sx={{ 
            p: { xs: 3, sm: 6, md: 10 }, 
            mb: 10, 
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}
        >
          <Hero />
        </Card>
      </Container>
    </OverviewWrapper>
  );
}

export default Overview;
