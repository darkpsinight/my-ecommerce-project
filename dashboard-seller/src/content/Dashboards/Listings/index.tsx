import { Helmet } from 'react-helmet-async';
import PageHeader from './PageHeader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from 'src/components/Footer';

import ListingsTable from './ListingsTable';
import ListingsSummary from './ListingsSummary';
import ListingsActions from './ListingsActions';
import { ListingsProvider } from './context/ListingsContext';

import { useState } from 'react';

function DashboardListings() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <>
      <Helmet>
        <title>Listings Management</title>
      </Helmet>
      <ListingsProvider>
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
              <ListingsSummary />
            </Grid>
            <Grid item xs={12}>
              <ListingsActions selected={selected} setSelected={setSelected} />
            </Grid>
            <Grid item xs={12}>
              <ListingsTable selected={selected} setSelected={setSelected} />
            </Grid>
          </Grid>
        </Container>
      </ListingsProvider>
      <Footer />
    </>
  );
}

export default DashboardListings;
