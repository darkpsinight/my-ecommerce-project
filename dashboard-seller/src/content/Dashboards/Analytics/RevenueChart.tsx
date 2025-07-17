import {
  Card,
  CardHeader,
  CardContent,
  Box,
  useTheme,
  Skeleton
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { RevenueChartData } from 'src/services/api/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data?: RevenueChartData;
  loading: boolean;
  timeRange: string;
}

function RevenueChart({ data, loading, timeRange }: RevenueChartProps) {
  const theme = useTheme();

  const formatChartData = () => {
    if (!data?.chartData) return null;

    const labels = data.chartData.map(item => {
      const { year, month, day, week } = item._id;
      
      if (day) {
        return `${month}/${day}`;
      } else if (week) {
        return `Week ${week}`;
      } else {
        return `${month}/${year}`;
      }
    });

    const revenueData = data.chartData.map(item => item.revenue);
    const ordersData = data.chartData.map(item => item.orders);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue ($)',
          data: revenueData,
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`,
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Orders',
          data: ordersData,
          borderColor: theme.palette.secondary.main,
          backgroundColor: `${theme.palette.secondary.main}20`,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.datasetIndex === 0) {
              // Revenue formatting
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            } else {
              // Orders formatting
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period'
        },
        grid: {
          color: theme.palette.divider,
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue ($)'
        },
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0
            }).format(value);
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Orders'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return Math.round(value).toLocaleString();
          }
        }
      }
    }
  };

  const chartData = formatChartData();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Revenue & Orders Trend"
        subheader={`Performance over time - ${timeRange.toUpperCase()}`}
      />
      <CardContent>
        <Box sx={{ height: 400, position: 'relative' }}>
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height="100%" />
          ) : chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
              color="text.secondary"
            >
              No data available for the selected time range
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default RevenueChart;