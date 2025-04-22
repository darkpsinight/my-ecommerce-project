import { FC } from 'react';
import {
  Card,
  CardHeader,
  Box,
  Divider,
  Table,
  TableBody,
  TableContainer,
  TablePagination
} from '@mui/material';

// Import custom hooks
import { useListings, useListingSelection, useListingMenus } from './hooks';

// Import components
import ListingsTableHeader from './components/ListingsTableHeader';
import ListingRow from './components/ListingRow';
import BulkActionsMenu from './components/BulkActionsMenu';
import { EmptyState, LoadingState, ErrorState } from './components/ListingsTableStates';

// Import types
import { ListingsTableProps } from './types';

const ListingsTable: FC<ListingsTableProps> = ({ selected, setSelected }) => {
  // Use custom hooks for data fetching and state management
  const {
    listings,
    loading,
    error,
    totalListings,
    page,
    limit,
    setPage,
    setLimit,
    fetchListings
  } = useListings();

  // Use selection hook
  const {
    isSelected,
    handleSelectAllClick,
    handleSelectClick
  } = useListingSelection({
    listings,
    selected,
    setSelected
  });

  // Use menus hook
  const {
    anchorEl,
    activeListingId,
    handleOpenMenu,
    handleCloseMenu,
    bulkAnchorEl,
    handleBulkMenuOpen,
    handleBulkMenuClose
  } = useListingMenus();

  // Pagination handlers
  const handlePageChange = (event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: any): void => {
    const newLimit = parseInt(event.target.value);
    setLimit(newLimit);
    setPage(0);
  };

  // Action handlers
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

  // Constants
  const TABLE_COLUMNS_COUNT = 10; // Including checkbox column

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
              <BulkActionsMenu
                selected={selected}
                anchorEl={bulkAnchorEl}
                onMenuOpen={handleBulkMenuOpen}
                onMenuClose={handleBulkMenuClose}
                onBulkAction={handleBulkAction}
              />
            </Box>
          </Box>
        }
        subheader="Manage all your product listings"
      />
      <Divider />
      <TableContainer>
        <Table>
          <ListingsTableHeader
            numSelected={selected.length}
            rowCount={listings.length}
            onSelectAllClick={handleSelectAllClick}
          />
          <TableBody>
            {error ? (
              <ErrorState colSpan={TABLE_COLUMNS_COUNT} error={error} />
            ) : loading ? (
              <LoadingState colSpan={TABLE_COLUMNS_COUNT} />
            ) : listings.length > 0 ? (
              listings.map((listing) => (
                <ListingRow
                  key={listing._id}
                  listing={listing}
                  isSelected={isSelected(listing._id)}
                  onSelectClick={handleSelectClick}
                  onViewClick={handleViewListing}
                  onEditClick={handleEditListing}
                  onDeleteClick={handleDeleteConfirmation}
                  anchorEl={anchorEl}
                  activeListingId={activeListingId}
                  onMenuOpen={handleOpenMenu}
                  onMenuClose={handleCloseMenu}
                />
              ))
            ) : (
              <EmptyState colSpan={TABLE_COLUMNS_COUNT} />
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
