import { Box, Container, Card } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { styled } from '@mui/material/styles';
import Logo from 'src/components/LogoSign';
import Hero from './Hero';
import { useAppSelector } from 'src/redux/hooks';

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
  const { APP_NAME } = useAppSelector((state) => state.config.data);
  
  return (
    <OverviewWrapper>
      <Helmet>
        <title>{APP_NAME} - Seller Dashboard</title>
      </Helmet>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4, lg: 5 } }}>
        <Box display="flex" justifyContent="center" py={5} alignItems="center">
          <Logo />
        </Box>
        <Card 
          sx={{ 
            p: { xs: 2, sm: 4, md: 6 }, 
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
