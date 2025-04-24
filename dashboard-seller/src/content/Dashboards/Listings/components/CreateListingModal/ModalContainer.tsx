import { FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  IconButton,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Toaster } from 'react-hot-toast';
import { ModalProvider, useModalContext } from './ModalContext';
import { CreateListingModalProps } from './types';
import { BasicInformation } from '../BasicInformation';
import { ProductDetails } from '../ProductDetails';
import { Pricing } from '../Pricing';
import { ProductCode } from '../ProductCode';

const ModalContent: FC = () => {
  const {
    formData,
    formErrors,
    handleChange,
    handleBlur,
    categories,
    availablePlatforms,
    regions,
    selectedPattern,
    validationError,
  } = useModalContext();

  return (
    <>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <BasicInformation
          formData={{
            title: formData.title,
            thumbnailUrl: formData.thumbnailUrl,
            description: formData.description
          }}
          formErrors={{
            title: formErrors.title,
            description: formErrors.description,
            thumbnailUrl: formErrors.thumbnailUrl
          }}
          handleChange={handleChange}
          handleBlur={handleBlur}
        />

        {/* Product Details */}
        <ProductDetails
          formData={{
            categoryId: formData.categoryId,
            platform: formData.platform,
            region: formData.region,
            isRegionLocked: formData.isRegionLocked,
            supportedLanguages: formData.supportedLanguages
          }}
          formErrors={{
            categoryId: formErrors.categoryId,
            platform: formErrors.platform,
            region: formErrors.region
          }}
          handleChange={handleChange}
          categories={categories}
          availablePlatforms={availablePlatforms}
          regions={regions}
        />

        {/* Pricing */}
        <Pricing
          formData={{
            price: formData.price,
            originalPrice: formData.originalPrice
          }}
          formErrors={{
            price: formErrors.price
          }}
          handleChange={handleChange}
        />

        {/* Product Code */}
        <ProductCode
          formData={{
            code: formData.code,
            expirationDate: formData.expirationDate,
            sellerNotes: formData.sellerNotes,
            tags: formData.tags
          }}
          formErrors={{
            code: formErrors.code
          }}
          handleChange={handleChange}
          selectedPattern={selectedPattern}
          validationError={validationError}
        />
      </Grid>
      <Toaster position="top-right" />
    </>
  );
};

const ModalActions: FC = () => {
  const { handleSubmit, submitting, loading, resetForm } = useModalContext();
  const { onClose } = useModalContainerProps();

  // Handle cancel button click - reset form and close modal
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
      <Button onClick={handleCancel} variant="outlined" disabled={submitting}>
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        variant="contained"
        color="primary"
        disabled={submitting || loading}
        startIcon={
          submitting && <CircularProgress size={20} color="inherit" />
        }
      >
        {submitting ? 'Creating...' : 'Create Listing'}
      </Button>
    </DialogActions>
  );
};

// Store modal props in a variable accessible to components
let modalContainerProps: CreateListingModalProps;

const useModalContainerProps = () => {
  return modalContainerProps;
};

const CreateListingModal: FC<CreateListingModalProps> = (props) => {
  // Store props in the variable
  modalContainerProps = props;
  const { open, onClose, onSubmit } = props;

  // Create a wrapper for onClose that resets the form
  const handleClose = () => {
    onClose();
  };

  return (
    <ModalProvider open={open} onClose={onClose} onSubmit={onSubmit}>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="h4">Create New Listing</Typography>
          <IconButton onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <ModalContent />
        </DialogContent>
        <Divider />
        <ModalActions />
      </Dialog>
    </ModalProvider>
  );
};

export default CreateListingModal;
