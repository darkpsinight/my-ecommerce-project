import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Campaign,
  Add,
  Info,
  Refresh
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi, CACData, MarketingSpendEntry, AddMarketingSpendRequest } from 'src/services/api/analytics';

interface CACDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (timeRange: '7d' | '30d' | '90d' | '1y') => void;
}

const MARKETING_CHANNELS = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'instagram_ads', label: 'Instagram Ads' },
  { value: 'twitter_ads', label: 'Twitter Ads' },
  { value: 'linkedin_ads', label: 'LinkedIn Ads' },
  { value: 'youtube_ads', label: 'YouTube Ads' },
  { value: 'tiktok_ads', label: 'TikTok Ads' },
  { value: 'reddit_ads', label: 'Reddit Ads' },
  { value: 'influencer_marketing', label: 'Influencer Marketing' },
  { value: 'affiliate_marketing', label: 'Affiliate Marketing' },
  { value: 'email_marketing', label: 'Email Marketing' },
  { value: 'content_marketing', label: 'Content Marketing' },
  { value: 'seo', label: 'SEO' },
  { value: 'referral_program', label: 'Referral Program' },
  { value: 'direct_mail', label: 'Direct Mail' },
  { value: 'events', label: 'Events' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'other', label: 'Other' }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const CACDashboard: React.FC<CACDashboardProps> = ({ 
  timeRange = '30d', 
  onTimeRangeChange 
}) => {
  const [cacData, setCacData] = useState<CACData | null>(null);
  const [marketingSpend, setMarketingSpend] = useState<MarketingSpendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addSpendOpen, setAddSpendOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for adding marketing spend
  const [spendForm, setSpendForm] = useState<AddMarketingSpendRequest>({
    amount: 0,
    currency: 'USD',
    channel: '',
    campaignName: '',
    description: '',
    spendDate: new Date().toISOString().split('T')[0],
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0]
  });

  const fetchCACData = async () => {
    try {
      setError(null);
      const response = await analyticsApi.getCACAnalytics({ timeRange });
      setCacData(response.data.cac);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch CAC analytics');
    }
  };

  const fetchMarketingSpend = async () => {
    try {
      const response = await analyticsApi.getMarketingSpend({ limit: 10 });
      setMarketingSpend(response.data.spendEntries);
    } catch (err: any) {
      console.error('Failed to fetch marketing spend:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchCACData(), fetchMarketingSpend()]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const handleAddSpend = async () => {
    try {
      await analyticsApi.addMarketingSpend(spendForm);
      setAddSpendOpen(false);
      setSpendForm({
        amount: 0,
        currency: 'USD',
        channel: '',
        campaignName: '',
        description: '',
        spendDate: new Date().toISOString().split('T')[0],
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0]
      });
      await loadData(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add marketing spend');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getChannelLabel = (channel: string) => {
    const channelObj = MARKETING_CHANNELS.find(c => c.value === channel);
    return channelObj ? channelObj.label : channel;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!cacData) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No CAC data available. Add some marketing spend entries to see analytics.
      </Alert>
    );
  }

  // Prepare chart data
  const dailyTrendData = cacData.dailyTrend.map(item => ({
    date: `${item.date.month}/${item.date.day}`,
    spend: item.totalSpend,
    customers: item.newCustomers,
    cac: item.cac
  }));

  const channelSpendData = cacData.spendByChannel.map(item => ({
    channel: getChannelLabel(item.channel),
    spend: item.totalSpend,
    campaigns: item.campaignCount
  }));

  const cacByChannelData = cacData.cacByChannel.map(item => ({
    channel: getChannelLabel(item.channel),
    cac: item.cac,
    customers: item.customerCount,
    spend: item.totalSpend
  }));

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddSpendOpen(true)}
          >
            Add Marketing Spend
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Marketing Spend
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {formatCurrency(cacData.totalMarketingSpend)}
                  </Typography>
                </Box>
                <AttachMoney color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    New Customers Acquired
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {cacData.newCustomersAcquired}
                  </Typography>
                </Box>
                <People color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Overall CAC
                    <Tooltip title="Total marketing spend divided by new customers acquired">
                      <IconButton size="small">
                        <Info fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {formatCurrency(cacData.overallCAC)}
                  </Typography>
                </Box>
                <Campaign color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    CAC Payback Period
                    <Tooltip title="Number of orders needed to recover acquisition cost">
                      <IconButton size="small">
                        <Info fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {cacData.cacPaybackPeriod.toFixed(1)} orders
                  </Typography>
                </Box>
                <TrendingUp color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} mb={4}>
        {/* Daily CAC Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader title="Daily CAC Trend" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'cac' ? formatCurrency(Number(value)) : value,
                      name === 'spend' ? 'Marketing Spend' : 
                      name === 'customers' ? 'New Customers' : 'CAC'
                    ]}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#8884d8" name="spend" />
                  <Line yAxisId="left" type="monotone" dataKey="customers" stroke="#82ca9d" name="customers" />
                  <Line yAxisId="right" type="monotone" dataKey="cac" stroke="#ffc658" name="cac" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Spend by Channel Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader title="Spend by Channel" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelSpendData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ channel, percent }) => `${channel} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="spend"
                  >
                    {channelSpendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CAC by Channel Table */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader title="CAC by Marketing Channel" />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Channel</TableCell>
                      <TableCell align="right">Total Spend</TableCell>
                      <TableCell align="right">Customers</TableCell>
                      <TableCell align="right">CAC</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cacByChannelData.map((row) => (
                      <TableRow key={row.channel}>
                        <TableCell component="th" scope="row">
                          {row.channel}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(row.spend)}</TableCell>
                        <TableCell align="right">{row.customers}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatCurrency(row.cac)}
                            color={row.cac < cacData.overallCAC ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Marketing Spend */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader title="Recent Marketing Spend" />
            <CardContent>
              <Box maxHeight={300} overflow="auto">
                {marketingSpend.map((spend) => (
                  <Box key={spend._id} mb={2} p={2} border={1} borderColor="grey.300" borderRadius={1}>
                    <Typography variant="subtitle2" gutterBottom>
                      {getChannelLabel(spend.channel)}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(spend.amount)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {spend.campaignName || 'No campaign name'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(spend.spendDate)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Marketing Spend Dialog */}
      <Dialog open={addSpendOpen} onClose={() => setAddSpendOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Marketing Spend</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={spendForm.amount}
                onChange={(e) => setSpendForm({ ...spendForm, amount: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={spendForm.currency}
                  onChange={(e) => setSpendForm({ ...spendForm, currency: e.target.value })}
                  label="Currency"
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Marketing Channel</InputLabel>
                <Select
                  value={spendForm.channel}
                  onChange={(e) => setSpendForm({ ...spendForm, channel: e.target.value })}
                  label="Marketing Channel"
                >
                  {MARKETING_CHANNELS.map((channel) => (
                    <MenuItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Name"
                value={spendForm.campaignName}
                onChange={(e) => setSpendForm({ ...spendForm, campaignName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={spendForm.description}
                onChange={(e) => setSpendForm({ ...spendForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Spend Date"
                type="date"
                value={spendForm.spendDate}
                onChange={(e) => setSpendForm({ ...spendForm, spendDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Period Start"
                type="date"
                value={spendForm.periodStart}
                onChange={(e) => setSpendForm({ ...spendForm, periodStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Period End"
                type="date"
                value={spendForm.periodEnd}
                onChange={(e) => setSpendForm({ ...spendForm, periodEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSpendOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSpend} variant="contained">Add Spend</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CACDashboard;