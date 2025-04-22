import { FC, useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Tooltip,
  IconButton,
  useTheme,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  alpha
} from '@mui/material';

import { getSellerListings } from 'src/services/api/listings';
import { CodeViewer } from './components/CodeViewer';

import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import { format } from 'date-fns';

interface Listing {
  _id: string;
  title: string;
  platform: string;
  codes?: Array<{
    code: string;
    soldStatus: string;
    soldAt?: string | Date;
  }>;
  price: number;
  status: string;
  createdAt: Date | string | null;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  region?: string;
  quantity?: number;
  expirationDate?: string | Date | null;
}

const applyPagination = (
  listings: Listing[],
  page: number,
  limit: number
): Listing[] => {
  return listings.slice(page * limit, page * limit + limit);
};

const ListingsTable: FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);
  const theme = useTheme();

  const [error, setError] = useState<string | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getSellerListings({
        page,
        limit
        // Removed status filter to show all listings
      });

      if (response && response.success && response.data) {
        setListings(response.data.listings || []);
      } else {
        setError(response.message || 'Failed to fetch listings');
        setListings([]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('An error occurred while fetching listings. Please try again.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [page, limit]); // Refetch when pagination changes

  const handlePageChange = (event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: any): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleViewListing = (id: string) => {
    console.log('View listing:', id);
    // Navigate to listing details page or open a modal
    handleCloseMenu();
  };

  const handleEditListing = (id: string) => {
    console.log('Edit listing:', id);
    // Navigate to edit form or open edit modal
    handleCloseMenu();
  };

  const handleDeleteConfirmation = (id: string) => {
    console.log('Delete listing:', id);
    // Show confirmation dialog before deleting
    // You could implement this with a Dialog component
    handleCloseMenu();
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setActiveListingId(id);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveListingId(null);
  };

  const paginatedListings = applyPagination(listings, page, limit);

  return (
    <Card>
      <CardHeader
        title="Your Listings"
        subheader="Manage all your product listings"
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Codes</TableCell>
              <TableCell align="center">Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Expiration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <Alert severity="error" sx={{ justifyContent: 'center' }}>
                    {error}
                  </Alert>
                </TableCell>
              </TableRow>
            ) : loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                  <Typography
                    variant="body1"
                    sx={{ mt: 1 }}
                    color="text.secondary"
                  >
                    Loading listings...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedListings.length > 0 ? (
              paginatedListings.map((listing) => {
                return (
                  <TableRow hover key={listing._id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold" noWrap>
                        {listing.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" noWrap>
                        {listing.platform}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {listing.codes && listing.codes.length > 0 ? (
                        <CodeViewer codes={listing.codes} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No codes available
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color={
                          listing.quantity > 0 ? 'success.main' : 'error.main'
                        }
                      >
                        {listing.quantity || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" noWrap>
                        ${listing.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" noWrap>
                        {listing.expirationDate
                          ? (() => {
                              try {
                                const dateObj =
                                  typeof listing.expirationDate === 'string'
                                    ? new Date(listing.expirationDate)
                                    : listing.expirationDate;
                                return format(dateObj, 'MM/dd/yyyy');
                              } catch (error) {
                                return 'Invalid date';
                              }
                            })()
                          : 'No expiration'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color={
                          listing.status === 'active'
                            ? 'success.main'
                            : listing.status === 'sold'
                            ? 'info.main'
                            : listing.status === 'draft'
                            ? 'warning.main'
                            : listing.status === 'expired'
                            ? 'text.secondary'
                            : 'error.main'
                        }
                        noWrap
                      >
                        {listing.status}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" noWrap>
                        {listing.createdAt
                          ? (() => {
                              try {
                                // Handle both string dates and Date objects
                                const dateObj =
                                  typeof listing.createdAt === 'string'
                                    ? new Date(listing.createdAt)
                                    : listing.createdAt;
                                return format(dateObj, 'MM/dd/yyyy');
                              } catch (error) {
                                console.error(
                                  'Invalid date format:',
                                  listing.createdAt
                                );
                                return 'Invalid date';
                              }
                            })()
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Actions" arrow>
                        <IconButton
                          onClick={(e) => handleOpenMenu(e, listing._id)}
                          size="small"
                          sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.1
                              )
                            }
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Menu
                        anchorEl={anchorEl}
                        open={
                          Boolean(anchorEl) && activeListingId === listing._id
                        }
                        onClose={handleCloseMenu}
                        keepMounted
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right'
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'right'
                        }}
                      >
                        <MenuItem
                          onClick={() => handleViewListing(listing._id)}
                        >
                          <VisibilityTwoToneIcon
                            fontSize="small"
                            sx={{ mr: 1, color: theme.palette.primary.main }}
                          />
                          View Details
                        </MenuItem>

                        <MenuItem
                          onClick={() => handleEditListing(listing._id)}
                          disabled={
                            listing.status === 'sold' ||
                            listing.status === 'expired'
                          }
                        >
                          <EditTwoToneIcon
                            fontSize="small"
                            sx={{ mr: 1, color: theme.palette.success.main }}
                          />
                          Edit Listing
                        </MenuItem>

                        <MenuItem
                          onClick={() => handleDeleteConfirmation(listing._id)}
                        >
                          <DeleteTwoToneIcon
                            fontSize="small"
                            sx={{ mr: 1, color: theme.palette.error.main }}
                          />
                          Delete Listing
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <Typography variant="h6" color="text.secondary">
                    No listings found
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Create your first listing to get started
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={listings.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 30]}
        />
      </Box>
    </Card>
  );
};

export default ListingsTable;
