import { Helmet } from 'react-helmet-async';
import PageHeader from './PageHeader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from 'src/components/Footer';

import ListingsTable from './ListingsTable';
import ListingsSummary from './ListingsSummary';
import ListingsActions from './ListingsActions';

function DashboardListings() {
  return (
    <>
      <Helmet>
        <title>Listings Management</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            <ListingsActions />
          </Grid>
          <Grid item lg={8} xs={12}>
            <ListingsTable />
          </Grid>
          <Grid item lg={4} xs={12}>
            <ListingsSummary />
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

export default DashboardListings;
