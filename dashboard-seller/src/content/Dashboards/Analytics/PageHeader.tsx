import { Typography, Button, Grid, Chip } from '@mui/material';
import { TrendingUp, Assessment, Star } from '@mui/icons-material';

function PageHeader() {
  return (
    <Grid container justifyContent="space-between" alignItems="center">
      <Grid item xs={12} sm={6}>
        <Typography variant="h3" component="h3" gutterBottom>
          <Assessment sx={{ fontSize: 32, color: 'primary.main', mr: 1, verticalAlign: 'middle' }} />
          VIP Analytics Dashboard
          <Chip 
            icon={<Star />} 
            label="VIP Feature" 
            color="primary" 
            variant="outlined"
            size="small"
            sx={{ ml: 2, verticalAlign: 'middle' }}
          />
        </Typography>
        <Typography variant="subtitle2">
          Comprehensive insights and performance metrics for VIP sellers
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 2, sm: 0 } }}>
        <Button
          variant="contained"
          startIcon={<TrendingUp />}
          size="medium"
        >
          Export Report
        </Button>
      </Grid>
    </Grid>
  );
}

export default PageHeader;