import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
  LinearProgress,
  Chip,
  FormHelperText
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CategoryIcon from '@mui/icons-material/Category';
import GamesIcon from '@mui/icons-material/Games';
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import NotesIcon from '@mui/icons-material/Notes';
import LockIcon from '@mui/icons-material/Lock';

import { Listing } from '../../../../types';
import { formatDate } from '../../utils/formatters';

interface OverviewTabProps {
  listing: Listing;
  activeCodes: number;
  totalCodes: number;
  activePercentage: number;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  listing,
  activeCodes,
  totalCodes,
  activePercentage
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Description Section */}
      {listing.description && (
        <Grid item xs={12}>
          <Card
            variant="outlined"
            sx={{
              overflow: 'hidden',
              boxShadow: theme.shadows[1]
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <InfoOutlinedIcon
                  sx={{
                    mr: 1,
                    color: theme.palette.info.main,
                    fontSize: 20
                  }}
                />
                Description
              </Typography>
              <Box
                dangerouslySetInnerHTML={{
                  __html: listing.description
                }}
                className="quill-content"
                sx={{
                  '& p': { marginBottom: '0.5em' },
                  '& ul, & ol': {
                    paddingLeft: '1.5em',
                    marginBottom: '0.5em'
                  },
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    marginBottom: '0.5em',
                    marginTop: '0.5em'
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Seller Notes Section - Only displayed if notes exist */}
      {listing.sellerNotes && (
        <Grid item xs={12}>
          <Card
            variant="outlined"
            sx={{
              overflow: 'hidden',
              boxShadow: theme.shadows[1]
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.5
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <NotesIcon
                    sx={{
                      mr: 1,
                      color: theme.palette.primary.main,
                      fontSize: 20
                    }}
                  />
                  Seller Notes
                </Typography>
                <Chip
                  icon={<LockIcon fontSize="small" />}
                  label="Private"
                  size="small"
                  color="default"
                  variant="outlined"
                  sx={{ fontWeight: 'medium' }}
                />
              </Box>
              <Box
                dangerouslySetInnerHTML={{
                  __html: listing.sellerNotes
                }}
                className="quill-content"
                sx={{
                  '& p': { marginBottom: '0.5em' },
                  '& ul, & ol': {
                    paddingLeft: '1.5em',
                    marginBottom: '0.5em'
                  },
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    marginBottom: '0.5em',
                    marginTop: '0.5em'
                  }
                }}
              />
              <FormHelperText sx={{ mt: 1, fontStyle: 'italic' }}>
                These notes are private and only visible to you. They will not
                be shared with buyers.
              </FormHelperText>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Product Details */}
      <Grid item xs={12} md={6}>
        <Card
          variant="outlined"
          sx={{
            height: '100%',
            boxShadow: theme.shadows[1]
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <CategoryIcon
                sx={{
                  mr: 1,
                  color: theme.palette.primary.main,
                  fontSize: 20
                }}
              />
              Product Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontSize: '0.75rem' }}
                  >
                    Category
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon
                      fontSize="small"
                      sx={{
                        mr: 1,
                        color: 'text.secondary',
                        opacity: 0.7
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {listing.categoryName || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontSize: '0.75rem' }}
                  >
                    Platform
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <GamesIcon
                      fontSize="small"
                      sx={{
                        mr: 1,
                        color: 'text.secondary',
                        opacity: 0.7
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {listing.platform || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontSize: '0.75rem' }}
                  >
                    Region
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PublicIcon
                      fontSize="small"
                      sx={{
                        mr: 1,
                        color: 'text.secondary',
                        opacity: 0.7
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {listing.region || 'Global'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontSize: '0.75rem' }}
                  >
                    Region Locked
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {listing.isRegionLocked ? (
                      <CheckCircleOutlineIcon
                        fontSize="small"
                        sx={{ mr: 1, color: 'warning.main' }}
                      />
                    ) : (
                      <ErrorOutlineIcon
                        fontSize="small"
                        sx={{ mr: 1, color: 'success.main' }}
                      />
                    )}
                    <Typography variant="body2" fontWeight={500}>
                      {listing.isRegionLocked ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Inventory Status */}
      <Grid item xs={12} md={6}>
        <Card
          variant="outlined"
          sx={{
            height: '100%',
            boxShadow: theme.shadows[1]
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <InventoryIcon
                sx={{
                  mr: 1,
                  color: theme.palette.info.main,
                  fontSize: 20
                }}
              />
              Inventory Status
            </Typography>

            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 1
                }}
              >
                <Typography variant="body2" fontWeight={500}>
                  Available
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={activeCodes > 0 ? 'success.main' : 'error.main'}
                >
                  {activeCodes} of {totalCodes}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={activePercentage}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.grey[300], 0.5),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 1,
                    backgroundColor:
                      activeCodes > 0 ? 'success.main' : 'error.light'
                  }
                }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontSize: '0.75rem' }}
                  >
                    Created At
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon
                      fontSize="small"
                      sx={{
                        mr: 1,
                        color: 'text.secondary',
                        opacity: 0.7
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {formatDate(listing.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontSize: '0.75rem' }}
                  >
                    Last Updated
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AutorenewIcon
                      fontSize="small"
                      sx={{
                        mr: 1,
                        color: 'text.secondary',
                        opacity: 0.7
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>
                      {listing.updatedAt
                        ? formatDate(listing.updatedAt)
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OverviewTab;
