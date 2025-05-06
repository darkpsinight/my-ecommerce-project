import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  IconButton,
  Typography,
  Divider,
  CircularProgress,
  Box,
  useTheme,
  alpha,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Tooltip,
  Autocomplete,
  Chip,
  useMediaQuery,
  DialogTitle,
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Toaster } from 'react-hot-toast';
import { ModalProvider, useModalContext } from './ModalContext';
import { CreateListingModalProps } from './types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { styled } from '@mui/material/styles';

// Styled components
const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  borderRadius: theme.shape.borderRadius,
  overflow: 'visible',
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.12)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
}));

const EditorContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  '& .ql-container': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '0 0 4px 4px',
    background: theme.palette.background.paper,
    minHeight: '150px',
    fontFamily: theme.typography.fontFamily,
  },
  '& .ql-toolbar': {
    background: theme.palette.grey[100],
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  },
  // Error state styling
  '&.error .ql-container': {
    border: `1px solid ${theme.palette.error.main}`,
  },
  '&.error .ql-toolbar': {
    borderColor: theme.palette.error.main,
  },
  // Helper text styling
  '& .MuiFormHelperText-root': {
    marginLeft: '14px',
    marginTop: '4px',
    color: theme.palette.text.secondary,
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  // Placeholder styling
  '& .ql-editor.ql-blank::before': {
    color: theme.palette.text.secondary,
    fontStyle: 'normal',
    opacity: 0.7,
  }
}));

// Main content component
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Custom handleChange for ReactQuill
  const handleDescriptionChange = (value: string) => {
    const syntheticEvent = {
      target: {
        name: 'description',
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIsLocked = e.target.checked;

    if (newIsLocked && formData.region === 'Global') {
      handleChange({
        target: {
          name: 'region',
          value: ''
        }
      } as any);
    }

    const event = {
      target: {
        name: e.target.name,
        value: newIsLocked
      }
    };
    handleChange(event as any);
  };

  // Handle tags change
  const handleTagsChange = (event, newValue) => {
    const syntheticEvent = {
      target: {
        name: 'tags',
        value: newValue
      }
    };
    handleChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <Box sx={{ py: 1 }}>
      {/* Basic Information Section */}
      <SectionCard>
        <CardContent>
          <SectionTitle variant="h6">
            Basic Information
          </SectionTitle>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Steam Game Key for Cyberpunk 2077"
                error={!!formErrors.title}
                helperText={formErrors.title || "Enter a descriptive title for your listing"}
                required
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thumbnail URL"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="https://example.com/image.jpg"
                error={!!formErrors.thumbnailUrl}
                helperText={formErrors.thumbnailUrl || "URL for the product image"}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Description <span style={{ color: 'red' }}>*</span>
              </Typography>
              <EditorContainer className={formErrors.description ? 'error' : ''}>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  modules={modules}
                  style={{ minHeight: isMobile ? '120px' : '150px' }}
                  placeholder="Provide a detailed description of your product. Include important features, usage instructions, and any other information buyers should know."
                />
                {formErrors.description && (
                  <div className="MuiFormHelperText-root Mui-error">
                    {formErrors.description}
                  </div>
                )}
              </EditorContainer>
            </Grid>
          </Grid>
        </CardContent>
      </SectionCard>

      {/* Product Details Section */}
      <SectionCard>
        <CardContent>
          <SectionTitle variant="h6">
            Product Details
          </SectionTitle>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.categoryId} required size={isMobile ? "small" : "medium"}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange as any}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.categoryId && (
                  <FormHelperText>{formErrors.categoryId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.platform} required size={isMobile ? "small" : "medium"}>
                <InputLabel>Platform</InputLabel>
                <Select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange as any}
                  label="Platform"
                >
                  {formData.categoryId === '' && (
                    <MenuItem disabled value="">
                      <em>Please choose a category first</em>
                    </MenuItem>
                  )}
                  {availablePlatforms.map((platform) => (
                    <MenuItem key={platform} value={platform}>
                      {platform}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.platform && (
                  <FormHelperText>{formErrors.platform}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.region} required size={isMobile ? "small" : "medium"}>
                <InputLabel>Region</InputLabel>
                <Select
                  name="region"
                  value={formData.region}
                  onChange={handleChange as any}
                  label="Region"
                >
                  {regions.map((region) => (
                    <MenuItem
                      key={region}
                      value={region}
                      disabled={region === 'Global' && formData.isRegionLocked}
                    >
                      {region}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.region && (
                  <FormHelperText>{formErrors.region}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isRegionLocked"
                    checked={Boolean(formData.isRegionLocked)}
                    onChange={handleCheckboxChange}
                    color="primary"
                  />
                }
                label="Region Locked?"
              />
            </Grid>
          </Grid>
        </CardContent>
      </SectionCard>

      {/* Pricing Section */}
      <SectionCard>
        <CardContent>
          <SectionTitle variant="h6">
            Pricing
          </SectionTitle>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: "0.01" }
                }}
                error={!!formErrors.price}
                helperText={formErrors.price || "Enter the selling price"}
                required
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Original Price (Optional)"
                name="originalPrice"
                type="number"
                value={formData.originalPrice}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: "0.01" }
                }}
                helperText="Set this higher than the price to show a discount"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        </CardContent>
      </SectionCard>

      {/* Product Code Section */}
      <SectionCard>
        <CardContent>
          <SectionTitle variant="h6">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              Product Code
              <Tooltip
                title="This code will be encrypted and securely stored. It will only be revealed to buyers after purchase."
                arrow
              >
                <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                  <InfoOutlinedIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
            </Box>
          </SectionTitle>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Code"
                name="code"
                value={formData.code}
                onChange={(e) => {
                  // Handle code formatting based on pattern
                  const { value } = e.target;
                  let formattedValue = value.replace(/-/g, ''); // Remove existing dashes
                  let finalValue = formattedValue;

                  // Apply formatting based on the selected pattern
                  if (selectedPattern && selectedPattern.example) {
                    try {
                      const example = selectedPattern.example;

                      if (example.includes('-')) {
                        // Get dash positions from the example
                        const dashPositions: number[] = [];
                        let exampleWithoutDashes = '';

                        for (let i = 0; i < example.length; i++) {
                          if (example[i] === '-') {
                            // Store the position in the string without dashes
                            dashPositions.push(exampleWithoutDashes.length);
                          } else {
                            exampleWithoutDashes += example[i];
                          }
                        }

                        // Apply dashes at the correct positions
                        finalValue = '';
                        let dashesAdded = 0;

                        for (let i = 0; i < formattedValue.length; i++) {
                          // Check if we need to add a dash before this character
                          if (dashPositions.includes(i)) {
                            finalValue += '-';
                            dashesAdded++;
                          }
                          finalValue += formattedValue[i];
                        }
                      }
                    } catch (error) {
                      console.error('Error applying code formatting:', error);
                      finalValue = formattedValue;
                    }
                  }

                  // Create a synthetic event with the formatted value
                  const syntheticEvent = {
                    ...e,
                    target: {
                      ...e.target,
                      name: 'code',
                      value: finalValue
                    }
                  };

                  handleChange(syntheticEvent);
                }}
                placeholder={selectedPattern?.example || "Enter the exact code that buyers will receive"}
                error={Boolean(formErrors.code) || Boolean(validationError)}
                helperText={
                  formErrors.code || validationError ||
                  (selectedPattern ? `Format: ${selectedPattern.description || selectedPattern.regex}` : "The code your buyers will receive after purchase")
                }
                required
                size={isMobile ? "small" : "medium"}
              />
              {selectedPattern && (
                <FormHelperText sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="primary">
                    Example: {selectedPattern.example}
                  </Typography>
                </FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiration Date (Optional)"
                name="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                helperText="Leave blank if the code doesn't expire"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Supported Languages</InputLabel>
                <Select
                  name="supportedLanguages"
                  multiple
                  value={formData.supportedLanguages}
                  onChange={handleChange as any}
                  label="Supported Languages"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  {['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean', 'Other'].map((lang) => (
                    <MenuItem key={lang} value={lang}>
                      <Checkbox checked={formData.supportedLanguages.indexOf(lang) > -1} />
                      <Typography>{lang}</Typography>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select all languages supported by this product</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.tags}
                onChange={handleTagsChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={`tag-${option}-${index}`}
                      variant="outlined"
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Tags (Optional)"
                    placeholder="Add tags and press Enter"
                    helperText="Add keywords to help buyers find your listing"
                    size={isMobile ? "small" : "medium"}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Seller Notes (Private)"
                name="sellerNotes"
                value={formData.sellerNotes}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Private notes (not visible to buyers)"
                helperText="These notes are only visible to you"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        </CardContent>
      </SectionCard>
      <Toaster position="top-right" />
    </Box>
  );
};

// Modal actions component
const ModalActions: FC = () => {
  const { handleSubmit, submitting, loading, resetForm } = useModalContext();
  const { onClose } = useModalContainerProps();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle cancel button click - reset form and close modal
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <DialogActions
      sx={{
        p: 2.5,
        justifyContent: 'space-between',
        backgroundColor: alpha(theme.palette.background.default, 0.04),
        borderTop: `1px solid ${theme.palette.divider}`,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}
    >
      <Button
        onClick={handleCancel}
        variant="outlined"
        disabled={submitting}
        fullWidth={isMobile}
        size={isMobile ? "medium" : "large"}
        sx={{
          px: { xs: 3, sm: 5 },
          py: { xs: 1, sm: 1.2 },
          borderRadius: 1.5
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        variant="contained"
        color="primary"
        disabled={submitting || loading}
        fullWidth={isMobile}
        size={isMobile ? "medium" : "large"}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AddTwoToneIcon />}
        sx={{
          px: { xs: 3, sm: 5 },
          py: { xs: 1, sm: 1.2 },
          borderRadius: 1.5,
          fontWeight: 600
        }}
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

// Main modal container component
const ImprovedCreateListingModal: FC<CreateListingModalProps> = (props) => {
  // Store props in the variable
  modalContainerProps = props;
  const { open, onClose, onSubmit, initialCategories } = props;
  const theme = useTheme();

  // Create a wrapper for onClose that resets the form
  const handleClose = () => {
    onClose();
  };

  return (
    <ModalProvider
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      initialCategories={initialCategories}
    >
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2.5,
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.15
            )}, ${alpha(theme.palette.primary.dark, 0.08)})`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.05)}`
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <AddTwoToneIcon
                sx={{
                  mr: 2,
                  color: theme.palette.primary.main,
                  fontSize: 26
                }}
              />
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  color: theme.palette.text.primary,
                  ml: 0.5
                }}
              >
                Create New Listing
              </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={handleClose}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                backgroundColor: alpha(theme.palette.primary.light, 0.2),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 1,
                p: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.light, 0.1),
                  color: theme.palette.primary.main
                },
                transition: theme.transitions.create(
                  ['background-color', 'color', 'box-shadow'],
                  {
                    duration: theme.transitions.duration.shortest
                  }
                )
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: alpha(theme.palette.background.default, 0.02)
          }}
        >
          <ModalContent />
        </DialogContent>
        <ModalActions />
      </Dialog>
    </ModalProvider>
  );
};

export default ImprovedCreateListingModal;