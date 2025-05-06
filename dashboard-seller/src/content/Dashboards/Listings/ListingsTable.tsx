import { FC, useContext, useState } from 'react';
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
import { useListingSelection, useListingMenus } from './hooks';
import { ListingsContext } from './context/ListingsContext';

// Import components
import ListingsTableHeader from './components/ListingsTableHeader';
import ListingRow from './components/ListingRow';
import BulkActionsMenu from './components/BulkActionsMenu';
import { EmptyState, LoadingState, ErrorState } from './components/ListingsTableStates';
import ViewListingDetailsModal from './components/ViewListingDetailsModal';
import { EditListingModal } from './components/EditListingModal';

// Import types
import { ListingsTableProps } from './types';

const ListingsTable: FC<ListingsTableProps> = ({ selected, setSelected }) => {
  // Use ListingsContext instead of the hook directly
  const {
    listings,
    loading,
    error,
    totalListings,
    page,
    limit,
    setPage,
    setLimit,
    refreshListings
  } = useContext(ListingsContext);

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

  // State for modals
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  // Action handlers
  const handleViewListing = (id: string) => {
    setSelectedListingId(id);
    setViewDetailsOpen(true);
    handleCloseMenu();
  };

  const handleEditListing = (id: string) => {
    setSelectedListingId(id);
    setEditModalOpen(true);
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
      case 'suspend':
        window.alert(`Suspend Selected: ${selected.join(', ')}`);
        break;
      case 'export':
        window.alert(`Export Selected to CSV: ${selected.join(', ')}`);
        break;
      default:
        break;
    }
  };

  // Handle listing update from the edit modal
  const handleListingUpdated = (updatedListing: any) => {
    console.log('Listing updated:', updatedListing);
    
    // Refresh the listings to show the updated data
    refreshListings();
    
    // Close the modal
    setEditModalOpen(false);
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
              listings.map((listing, index) => (
                <ListingRow
                  key={index}
                  listing={listing}
                  isSelected={isSelected(listing.externalId)}
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

      {/* View Listing Details Modal */}
      <ViewListingDetailsModal
        open={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
        listingId={selectedListingId}
        listings={listings}
      />

      {/* Edit Listing Modal */}
      <EditListingModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        listingId={selectedListingId}
        listings={listings}
        onListingUpdated={handleListingUpdated}
      />
    </Card>
  );
};

export default ListingsTable;
