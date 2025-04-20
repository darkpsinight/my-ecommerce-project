import { Typography, Grid } from '@mui/material';

function PageHeader() {
  return (
    <Grid container alignItems="center">
      <Grid item>
        <Typography variant="h3" component="h3" gutterBottom>
          Listings Management
        </Typography>
        <Typography variant="subtitle2">
          Manage your product listings and codes in one place
        </Typography>
      </Grid>
    </Grid>
  );
}

export default PageHeader;
