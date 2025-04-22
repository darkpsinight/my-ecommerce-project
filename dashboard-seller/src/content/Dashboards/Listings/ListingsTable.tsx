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
  alpha,
  Checkbox,
  Button,
  ListItemIcon,
  ListItemText
} from '@mui/material';

import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import DownloadTwoToneIcon from '@mui/icons-material/DownloadTwoTone';
import WarningAmberTwoToneIcon from '@mui/icons-material/WarningAmberTwoTone';

import { getSellerListings } from 'src/services/api/listings';
import { CodeViewer } from './components/CodeViewer';
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

interface ListingsTableProps {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

const ListingsTable: FC<ListingsTableProps> = ({ selected, setSelected }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);
  const theme = useTheme();

  const [error, setError] = useState<string | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);

  const [bulkAnchorEl, setBulkAnchorEl] = useState<null | HTMLElement>(null);

  const [totalListings, setTotalListings] = useState<number>(0);

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = listings.map((listing) => listing._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const fetchListings = async (
    pageOverride?: number,
    limitOverride?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getSellerListings({
        page: typeof pageOverride === 'number' ? pageOverride : page,
        limit: typeof limitOverride === 'number' ? limitOverride : limit
      });

      if (response && response.success && response.data) {
        setListings(response.data.listings || []);
        if (
          response.data.pagination &&
          typeof response.data.pagination.total === 'number'
        ) {
          setTotalListings(response.data.pagination.total);
        } else {
          setTotalListings((response.data.listings || []).length);
        }
      } else {
        setError(response.message || 'Failed to fetch listings');
        setListings([]);
        setTotalListings(0);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('An error occurred while fetching listings. Please try again.');
      setListings([]);
      setTotalListings(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [page, limit]);

  const handlePageChange = (event: any, newPage: number): void => {
    setPage(newPage);
    fetchListings(newPage, limit);
  };

  const handleLimitChange = (event: any): void => {
    const newLimit = parseInt(event.target.value);
    setLimit(newLimit);
    setPage(0);
    fetchListings(0, newLimit);
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

  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBulkAnchorEl(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setBulkAnchorEl(null);
  };

  const handleBulkAction = (action: string) => {
    handleBulkMenuClose();
    if (selected.length === 0) return;
    switch (action) {
      case 'delete':
        window.alert(`Delete Selected: ${selected.join(', ')}`);
        break;
      case 'pause':
        window.alert(`Pause Selected: ${selected.join(', ')}`);
        break;
      case 'export':
        window.alert(`Export Selected to CSV: ${selected.join(', ')}`);
        break;
      default:
        break;
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
          >
            <span>Your Listings</span>
            <Box>
              <Button
                sx={{ ml: 2 }}
                variant="outlined"
                disabled={selected.length === 0}
                onClick={handleBulkMenuOpen}
              >
                Bulk Actions
                {selected.length > 0 && (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 1,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: theme => theme.palette.primary.main,
                      color: theme => theme.palette.primary.contrastText,
                      fontWeight: 'bold',
                      fontSize: 14
                    }}
                  >
                    {selected.length}
                  </Box>
                )}
              </Button>
              <Menu
                anchorEl={bulkAnchorEl}
                open={Boolean(bulkAnchorEl)}
                onClose={handleBulkMenuClose}
              >
                <MenuItem
                  onClick={() => handleBulkAction('delete')}
                  disabled={selected.length === 0}
                >
                  <ListItemIcon>
                    <DeleteTwoToneIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Delete Selected</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => handleBulkAction('pause')}
                  disabled={selected.length === 0}
                >
                  <ListItemIcon>
                    <PauseCircleTwoToneIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Pause Selected</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => handleBulkAction('export')}
                  disabled={selected.length === 0}
                >
                  <ListItemIcon>
                    <DownloadTwoToneIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Export Selected to CSV</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        }
        subheader="Manage all your product listings"
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={
                    selected.length > 0 && selected.length < listings.length
                  }
                  checked={
                    listings.length > 0 && selected.length === listings.length
                  }
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all listings' }}
                />
              </TableCell>
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
            ) : listings.length > 0 ? (
              listings.map((listing) => {
                const isItemSelected = isSelected(listing._id);
                const isInactive =
                  listing.status === 'sold' || listing.quantity === 0;
                return (
                  <TableRow
                    hover
                    key={listing._id}
                    selected={isItemSelected}
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    sx={
                      isInactive
                        ? {
                            backgroundColor: (theme) =>
                              theme.palette.action.disabledBackground,
                            color: (theme) => theme.palette.text.disabled,
                            opacity: 0.7
                          }
                        : {}
                    }
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onClick={(event) => handleClick(event, listing._id)}
                        inputProps={{
                          'aria-labelledby': `enhanced-table-checkbox-${listing._id}`
                        }}
                      />
                    </TableCell>
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
                    <TableCell align="center">
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {listing.expirationDate ? (
                          (() => {
                            const expDate = new Date(listing.expirationDate);
                            const now = new Date();
                            const diffDays = Math.ceil(
                              (expDate.getTime() - now.getTime()) /
                                (1000 * 60 * 60 * 24)
                            );
                            return (
                              <>
                                {diffDays >= 0 && diffDays <= 7 && (
                                  <Tooltip
                                    title={`Expires in ${diffDays} day${
                                      diffDays !== 1 ? 's' : ''
                                    }`}
                                  >
                                    <WarningAmberTwoToneIcon
                                      sx={{ color: '#FFC107', mr: 0.5 }}
                                      fontSize="small"
                                    />
                                  </Tooltip>
                                )}
                                <Typography variant="body2" component="span">
                                  {format(expDate, 'yyyy-MM-dd')}
                                </Typography>
                              </>
                            );
                          })()
                        ) : (
                          <Typography variant="body2" component="span">
                            N/A
                          </Typography>
                        )}
                      </Box>
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
          count={totalListings}
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
