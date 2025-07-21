import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Slide,
  Avatar,
  Stack,
  Alert
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import {
  HelpOutline,
  Close,
  TrendingUp,
  ShoppingCart,
  Favorite,
  Lightbulb,
  CheckCircle,
  Warning,
  Error,
  TipsAndUpdates,
  Analytics
} from '@mui/icons-material';

interface WishlistInsightsHelpProps {
  className?: string;
}

// Slide transition for mobile
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function WishlistInsightsHelp({ className }: WishlistInsightsHelpProps) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Tooltip title="Learn about Wishlist Insights" arrow>
        <IconButton
          onClick={handleOpen}
          size="small"
          className={className}
          sx={{
            color: theme.palette.text.secondary,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.light + '20',
              transform: 'scale(1.1)'
            }
          }}
        >
          <HelpOutline fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={isMobile ? 'xs' : 'md'}
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={isMobile ? Transition : undefined}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100vh' : '95vh',
            m: isMobile ? 0 : 2,
            boxShadow: isMobile ? 'none' : theme.shadows[24]
          }
        }}
      >
        {/* Enhanced Header */}
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.primary.light}10)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            p: isMobile ? 2 : 3
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: isMobile ? 32 : 40,
                  height: isMobile ? 32 : 40
                }}
              >
                <Analytics fontSize={isMobile ? 'small' : 'medium'} />
              </Avatar>
              <Box>
                <Typography 
                  variant={isMobile ? 'h6' : 'h5'} 
                  component="div" 
                  fontWeight="bold"
                  color="primary"
                >
                  Wishlist Insights Guide
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Understanding your customer behavior
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleClose} 
              size={isMobile ? 'small' : 'medium'}
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  bgcolor: theme.palette.grey[100]
                }
              }}
            >
              <Close fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent 
          sx={{ 
            p: isMobile ? 2 : 3,
            bgcolor: theme.palette.background.default
          }}
        >
          {/* Introduction Alert */}
          <Alert 
            severity="info" 
            icon={<TipsAndUpdates />}
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: isMobile ? '0.875rem' : '1rem'
              }
            }}
          >
            <Typography variant="body2" fontWeight="medium">
              These insights automatically analyze your data to provide actionable business recommendations.
            </Typography>
          </Alert>

          <Stack spacing={isMobile ? 2 : 3}>
            {/* Interest Level Section - Redesigned */}
            <Card 
              elevation={0}
              sx={{ 
                border: `2px solid ${theme.palette.success.light}30`,
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.light}20, ${theme.palette.success.light}10)`,
                  p: isMobile ? 2 : 2.5,
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32 }}>
                    <TrendingUp fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="bold">
                      Interest Level
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Customer demand measurement
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                <Stack spacing={isMobile ? 1.5 : 2}>
                  {[
                    { 
                      level: 'High Interest', 
                      range: '50+ additions', 
                      desc: 'Strong market demand', 
                      color: theme.palette.success.main,
                      icon: CheckCircle 
                    },
                    { 
                      level: 'Moderate Interest', 
                      range: '20-50 additions', 
                      desc: 'Growing customer base', 
                      color: theme.palette.warning.main,
                      icon: Warning 
                    },
                    { 
                      level: 'Building Interest', 
                      range: '<20 additions', 
                      desc: 'Focus on marketing', 
                      color: theme.palette.info.main,
                      icon: Error 
                    }
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: isMobile ? 1.5 : 2,
                        bgcolor: `${item.color}08`,
                        borderRadius: 2,
                        border: `1px solid ${item.color}20`
                      }}
                    >
                      <item.icon sx={{ color: item.color, fontSize: 20 }} />
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.level} ({item.range})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Conversion Performance Section - Redesigned */}
            <Card 
              elevation={0}
              sx={{ 
                border: `2px solid ${theme.palette.primary.light}30`,
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.light}20, ${theme.palette.primary.light}10)`,
                  p: isMobile ? 2 : 2.5,
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    <ShoppingCart fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="bold">
                      Conversion Performance
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Wishlist to sales effectiveness
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                <Stack spacing={isMobile ? 1.5 : 2}>
                  {[
                    { 
                      level: 'Excellent', 
                      range: '≥15%', 
                      desc: 'Outstanding performance', 
                      color: theme.palette.success.main,
                      icon: CheckCircle 
                    },
                    { 
                      level: 'Good', 
                      range: '10-14%', 
                      desc: 'Room for optimization', 
                      color: theme.palette.warning.main,
                      icon: Warning 
                    },
                    { 
                      level: 'Needs Improvement', 
                      range: '<10%', 
                      desc: 'Consider strategies below', 
                      color: theme.palette.error.main,
                      icon: Error 
                    }
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: isMobile ? 1.5 : 2,
                        bgcolor: `${item.color}08`,
                        borderRadius: 2,
                        border: `1px solid ${item.color}20`
                      }}
                    >
                      <item.icon sx={{ color: item.color, fontSize: 20 }} />
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.level} ({item.range})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                {/* Improvement Tips */}
                <Alert 
                  severity="success" 
                  icon={<Lightbulb />}
                  sx={{ 
                    mt: 2,
                    borderRadius: 2,
                    bgcolor: theme.palette.success.light + '15'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    💡 Boost Your Conversions:
                  </Typography>
                  <Typography variant="body2" component="div">
                    • Exclusive wishlist discounts<br/>
                    • Limited-time offers via email<br/>
                    • Enhanced product visuals<br/>
                    • Stock shortage alerts
                  </Typography>
                </Alert>
              </CardContent>
            </Card>

            {/* Customer Retention Section - Redesigned */}
            <Card 
              elevation={0}
              sx={{ 
                border: `2px solid ${theme.palette.secondary.light}30`,
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.secondary.light}20, ${theme.palette.secondary.light}10)`,
                  p: isMobile ? 2 : 2.5,
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32 }}>
                    <Favorite fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="bold">
                      Customer Retention
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Long-term interest maintenance
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                <Stack spacing={isMobile ? 1.5 : 2}>
                  {[
                    { 
                      level: 'Great Retention', 
                      range: '≤20% abandonment', 
                      desc: 'Customers keep items wishlisted', 
                      color: theme.palette.success.main,
                      icon: CheckCircle 
                    },
                    { 
                      level: 'Average Retention', 
                      range: '20-40% abandonment', 
                      desc: 'Consider engagement strategies', 
                      color: theme.palette.warning.main,
                      icon: Warning 
                    },
                    { 
                      level: 'High Abandonment', 
                      range: '>40% abandonment', 
                      desc: 'Review product appeal', 
                      color: theme.palette.error.main,
                      icon: Error 
                    }
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: isMobile ? 1.5 : 2,
                        bgcolor: `${item.color}08`,
                        borderRadius: 2,
                        border: `1px solid ${item.color}20`
                      }}
                    >
                      <item.icon sx={{ color: item.color, fontSize: 20 }} />
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.level} ({item.range})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* How to Use Section */}
            <Alert 
              severity="info" 
              icon={<TipsAndUpdates />}
              sx={{ 
                borderRadius: 3,
                bgcolor: theme.palette.primary.light + '10',
                border: `1px solid ${theme.palette.primary.light}30`
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                🎯 Making Data-Driven Decisions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                These insights update automatically with your real data. Use them to identify what's working, 
                spot growth opportunities, and optimize your pricing and marketing strategies for better results.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions 
          sx={{ 
            p: isMobile ? 2 : 3,
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Button 
            onClick={handleClose} 
            variant="contained" 
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isMobile}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              py: isMobile ? 1.5 : 1
            }}
          >
            Got it, thanks! 🚀
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default WishlistInsightsHelp;