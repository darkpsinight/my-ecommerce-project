import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Grid, Typography } from '@mui/material';
import PageTitleWrapper from 'src/components/PageTitleWrapper';

import CACDashboard from 'src/components/Analytics/CACDashboard';
import { useAnalyticsContext } from '../context/AnalyticsContext';

const CACAnalytics: React.FC = () => {
  const { timeRange, setTimeRange } = useAnalyticsContext();

  return (
    <>
      <Helmet>
        <title>CAC Analytics - Seller Dashboard</title>
      </Helmet>
      <PageTitleWrapper>
        <Typography variant="h3" component="h1" gutterBottom>
          Customer Acquisition Cost Analytics
        </Typography>
        <Typography variant="subtitle2" color="textSecondary">
          Track your marketing spend and customer acquisition efficiency
        </Typography>
      </PageTitleWrapper>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <CACDashboard 
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default CACAnalytics;