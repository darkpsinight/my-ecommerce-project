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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tooltip,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  TrendingUp,
  TrendingDown,
  Payment,
  Assessment,
  Refresh,
  Info
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { analyticsApi, TransactionSuccessRateData, TransactionSuccessRateParams } from 'src/services/api/analytics';

interface TransactionSuccessRateDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  groupBy?: 'hour' | 'day' | 'week' | 'month';
  onTimeRangeChange?: (timeRange: '7d' | '30d' | '90d' | '1y') => void;
  onGroupByChange?: (groupBy: 'hour' | 'day' | 'week' | 'month') => void;
}

const COLORS = ['#4CAF50', '#F44336', '#FF9800', '#2196F3', '#9C27B0'];

const TransactionSuccessRateDashboard: React.FC<TransactionSuccessRateDashboardProps> = ({ 
  timeRange = '30d',
  groupBy = 'day',
  onTimeRangeChange,
  onGroupByChange
}) => {
  const [data, setData] = useState<TransactionSuccessRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await analyticsApi.getTransactionSuccessRate({ timeRange, groupBy });
      
      if (response.success) {
        setData(response.data);
      } else {
        setError('Failed to fetch transaction success rate data');
      }
    } catch (err: any) {
      console.error('Error fetching transaction success rate:', err);
      setError(err.response?.data?.error || 'Failed to fetch transaction success rate data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, groupBy]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatPeriod = (period: any) => {
    if (period.hour !== undefined) {
      return `${period.year}-${String(period.month).padStart(2, '0')}-${String(period.day).padStart(2, '0')} ${String(period.hour).padStart(2, '0')}:00`;
    } else if (period.day !== undefined) {
      return `${period.year}-${String(period.month).padStart(2, '0')}-${String(period.day).padStart(2, '0')}`;
    } else if (period.week !== undefined) {
      return `${period.year}-W${String(period.week).padStart(2, '0')}`;
    } else {
      return `${period.year}-${String(period.month).padStart(2, '0')}`;
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return '#4CAF50'; // Green
    if (rate >= 90) return '#8BC34A'; // Light Green
    if (rate >= 80) return '#FF9800'; // Orange
    if (rate >= 70) return '#FF5722'; // Deep Orange
    return '#F44336'; // Red
  };

  const getSuccessRateIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle sx={{ color: '#4CAF50' }} />;
    if (rate >= 80) return <TrendingUp sx={{ color: '#FF9800' }} />;
    return <Error sx={{ color: '#F44336' }} />;
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

  if (!data) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No transaction success rate data available for the selected time range.
      </Alert>
    );
  }

  // Prepare chart data
  const chartData = data.timeTrends.map(trend => ({
    period: formatPeriod(trend.period),
    successRate: trend.successRate,
    failureRate: trend.failureRate,
    totalTransactions: trend.totalTransactions,
    successfulTransactions: trend.successfulTransactions,
    failedTransactions: trend.failedTransactions
  }));

  // Prepare payment method pie chart data
  const paymentMethodData = data.byPaymentMethod.map(method => ({
    name: method.paymentMethod,
    value: method.totalTransactions,
    successRate: method.successRate
  }));

  return (
    <Box>
      {/* Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Group By</InputLabel>
            <Select
              value={groupBy}
              label="Group By"
              onChange={(e) => onGroupByChange?.(e.target.value as any)}
            >
              <MenuItem value="hour">Hour</MenuItem>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
            </Select>
          </FormControl>

          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Overall Statistics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Overall Success Rate
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ color: getSuccessRateColor(data.overall.successRate) }}>
                    {data.overall.successRate}%
                  </Typography>
                </Box>
                {getSuccessRateIcon(data.overall.successRate)}
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
                    Total Transactions
                  </Typography>
                  <Typography variant="h4" component="div">
                    {data.overall.totalTransactions.toLocaleString()}
                  </Typography>
                </Box>
                <Assessment color="primary" />
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
                    Successful Transactions
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    {data.overall.successfulTransactions.toLocaleString()}
                  </Typography>
                </Box>
                <CheckCircle color="success" />
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
                    Failed Transactions
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {data.overall.failedTransactions.toLocaleString()}
                  </Typography>
                </Box>
                <Error color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Rate Trend Chart */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Success Rate Trend" 
              action={
                <Tooltip title="Shows the success rate trend over time">
                  <IconButton>
                    <Info />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} />
                  <RechartsTooltip 
                    formatter={(value: any, name: string) => [
                      `${value}%`, 
                      name === 'successRate' ? 'Success Rate' : 'Failure Rate'
                    ]}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="successRate" 
                    stackId="1"
                    stroke="#4CAF50" 
                    fill="#4CAF50" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failureRate" 
                    stackId="1"
                    stroke="#F44336" 
                    fill="#F44336" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transaction Type Breakdown */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Success Rate by Transaction Type" />
            <CardContent>
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Funding Transactions
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.byTransactionType.funding.successRate} 
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {data.byTransactionType.funding.successRate}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {data.byTransactionType.funding.successfulTransactions} / {data.byTransactionType.funding.totalTransactions} transactions
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Purchase Transactions
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.byTransactionType.purchase.successRate} 
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {data.byTransactionType.purchase.successRate}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {data.byTransactionType.purchase.successfulTransactions} / {data.byTransactionType.purchase.totalTransactions} transactions
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Transactions by Payment Method" />
            <CardContent>
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, successRate }) => `${name}: ${value} (${successRate}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => [value, 'Transactions']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  No payment method data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Method Details Table */}
      {data.byPaymentMethod.length > 0 && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Payment Method Performance" />
              <CardContent>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Payment Method</TableCell>
                        <TableCell align="right">Total Transactions</TableCell>
                        <TableCell align="right">Successful</TableCell>
                        <TableCell align="right">Failed</TableCell>
                        <TableCell align="right">Success Rate</TableCell>
                        <TableCell align="right">Failure Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.byPaymentMethod.map((method) => (
                        <TableRow key={method.paymentMethod}>
                          <TableCell component="th" scope="row">
                            <Chip 
                              label={method.paymentMethod} 
                              size="small" 
                              icon={<Payment />}
                            />
                          </TableCell>
                          <TableCell align="right">{method.totalTransactions.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>
                            {method.successfulTransactions.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            {method.failedTransactions.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${method.successRate}%`}
                              size="small"
                              sx={{ 
                                backgroundColor: getSuccessRateColor(method.successRate),
                                color: 'white'
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${method.failureRate}%`}
                              size="small"
                              color={method.failureRate > 10 ? 'error' : 'default'}
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
        </Grid>
      )}

      {/* Failure Analysis */}
      {data.failureAnalysis.totalFailures > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title={`Failure Analysis (${data.failureAnalysis.totalFailures} total failures)`}
                action={
                  <Tooltip title="Analysis of transaction failure reasons">
                    <IconButton>
                      <Info />
                    </IconButton>
                  </Tooltip>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Failures by Type
                    </Typography>
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Transaction Failures</Typography>
                        <Chip 
                          label={data.failureAnalysis.failuresByType.transactionFailures}
                          size="small"
                          color="error"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Typography variant="body2">Order Failures</Typography>
                        <Chip 
                          label={data.failureAnalysis.failuresByType.orderFailures}
                          size="small"
                          color="error"
                        />
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Top Failure Reasons
                    </Typography>
                    {data.failureAnalysis.topFailureReasons.slice(0, 5).map((reason, index) => (
                      <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ maxWidth: '70%' }}>
                          {reason.reason}
                        </Typography>
                        <Box display="flex" gap={1}>
                          <Chip 
                            label={reason.count}
                            size="small"
                            variant="outlined"
                          />
                          <Chip 
                            label={`${reason.percentage}%`}
                            size="small"
                            color="error"
                          />
                        </Box>
                      </Box>
                    ))}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default TransactionSuccessRateDashboard;