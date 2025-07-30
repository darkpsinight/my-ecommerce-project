import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Grid, Card, CardHeader, Divider } from '@mui/material';
import { useAnalyticsContext } from '../context/AnalyticsContext';
import TransactionSuccessRateDashboard from 'src/components/Analytics/TransactionSuccessRateDashboard';

function TransactionSuccessRateAnalytics() {
  const { timeRange, setTimeRange } = useAnalyticsContext();
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  return (
    <>
      <Helmet>
        <title>Transaction Success Rate Analytics - Seller Dashboard</title>
      </Helmet>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Transaction Success Rate Analytics" />
              <Divider />
              <TransactionSuccessRateDashboard
                timeRange={timeRange}
                groupBy={groupBy}
                onTimeRangeChange={setTimeRange}
                onGroupByChange={setGroupBy}
              />
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default TransactionSuccessRateAnalytics;