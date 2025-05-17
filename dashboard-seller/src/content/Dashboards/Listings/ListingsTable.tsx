import { FC, useContext, useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  Box,
  Divider,
  Table,
  TableBody,
  TableContainer,
  TablePagination,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { showSuccessToast, showErrorToast } from './components/ListingsActions/ToastNotifications';

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

// Import API service
import {
  getCategories,
  deleteListing,
  bulkDeleteListings,
  bulkUpdateListingsStatus
} from '../../../services/api/listings';
import { useAppDispatch } from 'src/redux/hooks';

// Import CSV export utility
import { exportListingsToCSV } from '../../../utils/csvExport';

// Import confirmation dialog
import ConfirmationDialog from '../../../components/ConfirmationDialog';

// Import types
import { ListingsTableProps } from './types';

const ListingsTable: FC<ListingsTableProps> = ({ selected, setSelected }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [listingDetailsForDelete, setListingDetailsForDelete] = useState<any>(null);

  // State for bulk delete confirmation dialog
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteInProgress, setBulkDeleteInProgress] = useState(false);

  // State for bulk status change confirmation dialog
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatusInProgress, setBulkStatusInProgress] = useState(false);
  const [selectedStatusAction, setSelectedStatusAction] = useState<string | null>(null);

  // State for categories
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState<boolean>(false);

  // Fetch categories only when needed
  const fetchCategories = useCallback(async () => {
    if (categoriesLoaded) return; // Skip if already loaded

    try {
      const data = await getCategories();
      if (data && data.success && Array.isArray(data.data)) {
        setCategories(data.data);
        setCategoriesLoaded(true);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, [categoriesLoaded]);

  // Action handlers
  const handleViewListing = (id: string) => {
    setSelectedListingId(id);
    setViewDetailsOpen(true);
    handleCloseMenu();
  };

  const handleEditListing = (id: string) => {
    setSelectedListingId(id);
    setEditModalOpen(true);
    // Fetch categories when opening the edit modal
    fetchCategories();
    handleCloseMenu();
  };

  const handleDeleteConfirmation = (id: string) => {
    console.log('Delete listing:', id);

    // Find the listing details
    const listingToDelete = listings.find(listing => listing.externalId === id);

    if (listingToDelete) {
      // Set the listing ID to delete and prepare details for the dialog
      setListingToDelete(id);

      // Format price with currency symbol
      const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(listingToDelete.price);

      // Format date
      const formattedDate = new Date(listingToDelete.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Get code count from the listing
      const codeCount = listingToDelete.codes?.length || 0;

      // Create additional warning message based on code count
      let additionalWarning = '';
      if (codeCount > 0) {
        additionalWarning = `This listing contains ${codeCount} ${codeCount === 1 ? 'code' : 'codes'} that will be permanently deleted. Make sure you have backed up any important information before proceeding.`;
      }

      // Set details for the confirmation dialog
      setListingDetailsForDelete({
        title: listingToDelete.title, // Pass the full title, truncation will be handled in the ConfirmationDialog
        fullTitle: listingToDelete.title, // Store the full title for responsive display
        subtitle: `${listingToDelete.platform} • ${listingToDelete.status === 'active' ? 'On Sale' : listingToDelete.status.charAt(0).toUpperCase() + listingToDelete.status.slice(1)}`,
        metadata: [
          { label: 'Price', value: formattedPrice },
          { label: 'Created', value: formattedDate },
          { label: 'Category', value: listingToDelete.categoryName || 'N/A' }
        ],
        codeCount: codeCount,
        additionalWarning: additionalWarning
      });

      setDeleteDialogOpen(true);
    } else {
      showErrorToast('Listing not found');
    }

    handleCloseMenu();
  };

  const handleDeleteCancel = () => {
    // Close the dialog and reset state
    setDeleteDialogOpen(false);
    setListingToDelete(null);
    setListingDetailsForDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return;

    setDeleteInProgress(true);
    try {
      // Call the API to delete the listing
      const response = await deleteListing(listingToDelete);

      if (response && response.success) {
        // Show success notification
        showSuccessToast('Listing deleted successfully');

        // Refresh the listings to update the UI
        refreshListings();

        // The refreshListings function will dispatch the listingsRefreshed event
        // which will trigger the ListingsSummary component to update
      } else {
        // Show error notification
        showErrorToast(response?.message || 'Failed to delete listing');
      }
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      // Show error notification with more details if available
      showErrorToast(error.response?.data?.message || error.message || 'Failed to delete listing');
    } finally {
      // Reset state
      setDeleteInProgress(false);
      setDeleteDialogOpen(false);
      setListingToDelete(null);
      setListingDetailsForDelete(null);
    }
  };

  const handleBulkAction = (action: string, subAction?: string) => {
    handleBulkMenuClose();
    if (selected.length === 0) return;

    switch (action) {
      case 'delete':
        // Open bulk delete confirmation dialog
        setBulkDeleteDialogOpen(true);
        break;
      case 'status':
        if (subAction && ['active', 'draft'].includes(subAction)) {
          // Set the selected status action and open confirmation dialog
          setSelectedStatusAction(subAction);
          setBulkStatusDialogOpen(true);
        }
        break;
      case 'export-csv':
        // Export selected listings to CSV
        try {
          exportListingsToCSV(listings, selected);
          showSuccessToast(`Successfully exported ${selected.length} listings to CSV`);
        } catch (error) {
          console.error('Error exporting listings to CSV:', error);
          showErrorToast('Failed to export listings to CSV');
        }
        break;
      default:
        break;
    }
  };

  // Helper function to get selected listings details for delete dialog
  const getSelectedListingsDetails = () => {
    // Get the first 3 selected listings to show in the dialog
    const selectedListings = listings
      .filter(listing => selected.includes(listing.externalId))
      .slice(0, 3);

    // Calculate total price of selected listings
    const totalPrice = listings
      .filter(listing => selected.includes(listing.externalId))
      .reduce((sum, listing) => sum + (listing.price || 0), 0);

    // Calculate total code count
    const totalCodeCount = listings
      .filter(listing => selected.includes(listing.externalId))
      .reduce((sum, listing) => sum + (listing.codes?.length || 0), 0);

    // Format total price
    const formattedTotalPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(totalPrice);

    // Create additional warning message based on code count
    let additionalWarning = '';
    if (totalCodeCount > 0) {
      additionalWarning = `You are about to delete a total of ${totalCodeCount} ${totalCodeCount === 1 ? 'code' : 'codes'} across ${selected.length} listings. This action cannot be undone and all code data will be permanently lost.`;
    }

    return {
      title: `${selected.length} Listings Selected`,
      subtitle: `Total value: ${formattedTotalPrice}`,
      metadata: [
        ...selectedListings.map(listing => {
          const codeCount = listing.codes?.length || 0;
          return {
            label: isMobile
              ? (listing.title.length > 15 ? listing.title.substring(0, 15) + '...' : listing.title)
              : (listing.title.length > 25 ? listing.title.substring(0, 25) + '...' : listing.title),
            value: `${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(listing.price || 0)}${codeCount > 0 ? ` (${codeCount} ${codeCount === 1 ? 'code' : 'codes'})` : ''}`
          };
        }),
        ...(selected.length > 3 ? [{ label: `And ${selected.length - 3} more...`, value: '' }] : [])
      ],
      codeCount: totalCodeCount,
      additionalWarning: additionalWarning
    };
  };

  // Helper function to get selected listings details for status change dialog
  const getSelectedListingsStatusDetails = (status: string) => {
    // Get the first 3 selected listings to show in the dialog
    const selectedListings = listings
      .filter(listing => selected.includes(listing.externalId))
      .slice(0, 3);

    // Count listings by current status
    const statusCounts = listings
      .filter(listing => selected.includes(listing.externalId))
      .reduce((counts, listing) => {
        counts[listing.status] = (counts[listing.status] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

    // Calculate total code count
    const totalCodeCount = listings
      .filter(listing => selected.includes(listing.externalId))
      .reduce((sum, listing) => sum + (listing.codes?.length || 0), 0);

    // Create additional warning or info message based on the target status
    let additionalWarning = '';
    if (status === 'active') {
      // Check if any listings have no codes
      const listingsWithNoCodes = listings
        .filter(listing => selected.includes(listing.externalId) && (!listing.codes || listing.codes.length === 0))
        .length;

      if (listingsWithNoCodes > 0) {
        additionalWarning = `${listingsWithNoCodes} of the selected listings have no codes and cannot be set to On Sale status. Only listings with at least one code can be active.`;
      }
    }

    // Format status display
    const statusDisplay = status === 'active' ? 'On Sale' : status.charAt(0).toUpperCase() + status.slice(1);

    return {
      title: `Change Status for ${selected.length} Listings`,
      subtitle: `New status: ${statusDisplay}`,
      metadata: [
        ...selectedListings.map(listing => {
          const codeCount = listing.codes?.length || 0;
          const currentStatus = listing.status === 'active' ? 'On Sale' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1);
          return {
            label: isMobile
              ? (listing.title.length > 15 ? listing.title.substring(0, 15) + '...' : listing.title)
              : (listing.title.length > 25 ? listing.title.substring(0, 25) + '...' : listing.title),
            value: `${currentStatus}${codeCount > 0 ? ` (${codeCount} ${codeCount === 1 ? 'code' : 'codes'})` : ' (No codes)'}`
          };
        }),
        ...(selected.length > 3 ? [{ label: `And ${selected.length - 3} more...`, value: '' }] : [])
      ],
      additionalWarning: additionalWarning
    };
  };

  const handleBulkDeleteCancel = () => {
    // Close the dialog and reset state
    setBulkDeleteDialogOpen(false);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selected.length === 0) return;

    setBulkDeleteInProgress(true);

    try {
      // Call the bulk delete API
      const response = await bulkDeleteListings(selected);

      // Show appropriate notification based on results
      if (response.success) {
        showSuccessToast(response.message);
      } else {
        showErrorToast(response.message || 'Failed to delete listings');
      }

      // Refresh the listings to update the UI
      refreshListings();

      // The refreshListings function will dispatch the listingsRefreshed event
      // which will trigger the ListingsSummary component to update

      // Clear selection
      setSelected([]);
    } catch (error: any) {
      console.error('Error in bulk delete operation:', error);
      showErrorToast('An error occurred during the bulk delete operation');
    } finally {
      // Reset state
      setBulkDeleteInProgress(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleBulkStatusCancel = () => {
    // Close the dialog and reset state
    setBulkStatusDialogOpen(false);
    setSelectedStatusAction(null);
  };

  const handleBulkStatusConfirm = async () => {
    if (selected.length === 0 || !selectedStatusAction) return;

    setBulkStatusInProgress(true);

    try {
      // Call the bulk status update API
      const response = await bulkUpdateListingsStatus(selected, selectedStatusAction);

      // Show appropriate notification based on results
      if (response.success) {
        showSuccessToast(response.message);
      } else {
        showErrorToast(response.message || 'Failed to update listing status');
      }

      // Refresh the listings to update the UI
      refreshListings();

      // The refreshListings function will dispatch the listingsRefreshed event
      // which will trigger the ListingsSummary component to update

      // Clear selection
      setSelected([]);
    } catch (error: any) {
      console.error('Error in bulk status update operation:', error);
      showErrorToast('An error occurred during the status update operation');
    } finally {
      // Reset state
      setBulkStatusInProgress(false);
      setBulkStatusDialogOpen(false);
      setSelectedStatusAction(null);
    }
  };

  // Handle listing update from the edit modal
  const handleListingUpdated = (updatedListing: any) => {
    console.log('Listing updated:', updatedListing);

    // Refresh the listings to show the updated data
    refreshListings();

    // The refreshListings function will dispatch the listingsRefreshed event
    // which will trigger the ListingsSummary component to update

    // Close the modal
    setEditModalOpen(false);
  };

  // Listen for status updates from the modal
  useEffect(() => {
    const handleStatusUpdate = (event: CustomEvent) => {
      console.log('Status update event received:', event.detail);

      // Refresh the listings to show the updated data
      refreshListings();

      // The refreshListings function will dispatch the listingsRefreshed event
      // which will trigger the ListingsSummary component to update

      // Note: We don't close the modal here, allowing the user to continue editing
    };

    // Add event listener for the custom event
    window.addEventListener('listingStatusUpdated', handleStatusUpdate as EventListener);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('listingStatusUpdated', handleStatusUpdate as EventListener);
    };
  }, [refreshListings]);

  // Constants
  const TABLE_COLUMNS_COUNT = 10; // Including checkbox column and the new Total column

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
              <LoadingState colSpan={TABLE_COLUMNS_COUNT} rowsCount={limit > 5 ? 5 : limit} />
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
        initialCategories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteInProgress}
        severity="error"
        itemDetails={listingDetailsForDelete}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        title="Delete Selected Listings"
        message={`Are you sure you want to delete ${selected.length} selected listings? This action cannot be undone.`}
        confirmButtonText="Delete All"
        cancelButtonText="Cancel"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={handleBulkDeleteCancel}
        isLoading={bulkDeleteInProgress}
        severity="error"
        itemDetails={selected.length > 0 ? getSelectedListingsDetails() : undefined}
      />

      {/* Bulk Status Change Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkStatusDialogOpen}
        title={`Change Status to ${selectedStatusAction === 'active' ? 'On Sale' : 'Draft'}`}
        message={`Are you sure you want to change the status of ${selected.length} selected listings to ${selectedStatusAction === 'active' ? 'On Sale' : 'Draft'}?`}
        confirmButtonText="Change Status"
        cancelButtonText="Cancel"
        onConfirm={handleBulkStatusConfirm}
        onCancel={handleBulkStatusCancel}
        isLoading={bulkStatusInProgress}
        severity={selectedStatusAction === 'active' ? 'success' : 'warning'}
        itemDetails={selectedStatusAction ? getSelectedListingsStatusDetails(selectedStatusAction) : undefined}
      />
    </Card>
  );
};

export default ListingsTable;
