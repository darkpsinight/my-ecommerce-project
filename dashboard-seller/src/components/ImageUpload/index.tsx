import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Tabs,
  Tab,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import { uploadImage } from 'src/services/api/imageUpload';
import { toast } from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  sx?: any; // Add support for sx prop
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, sx, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`image-upload-tabpanel-${index}`}
      aria-labelledby={`image-upload-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, ...(sx || {}) }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `image-upload-tab-${index}`,
    'aria-controls': `image-upload-tabpanel-${index}`,
  };
}

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  isCreateListing?: boolean; // Flag to indicate if this is for Create Listing modal
  isEditListing?: boolean; // Flag to indicate if this is for Edit Listing modal
  onFileSelect?: (file: File | null) => void; // Callback when a file is selected
  temporaryFile?: File | null; // Temporary file for deferred upload
  uploadInProgress?: boolean; // Flag to indicate if upload is in progress
  onUrlChange?: (url: string) => void; // Callback when URL is entered (for Edit Listing)
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  error,
  isCreateListing = false,
  isEditListing = false,
  onFileSelect,
  temporaryFile,
  uploadInProgress = false,
  onUrlChange
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [urlValue, setUrlValue] = useState(value || '');
  const [file, setFile] = useState<File | null>(temporaryFile || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlValue(newUrl);

    // Pass to parent component for tracking
    if (onUrlChange) {
      onUrlChange(newUrl);
    }
  };

  // Handle URL validation and update on blur
  const handleUrlBlur = () => {
    try {
      // Basic URL validation
      new URL(urlValue);
      // Update the image URL in the parent component
      onChange(urlValue);
      toast.success('Image URL updated');
    } catch (error) {
      toast.error('Please enter a valid URL');
    }
  };

  // Create a preview URL when a file is selected
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Clean up the URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // Update local file state when temporaryFile prop changes
  useEffect(() => {
    if (temporaryFile !== undefined) {
      setFile(temporaryFile);
    }
  }, [temporaryFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      // Check if file is an image
      if (!selectedFile.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        setFile(null);
        if (onFileSelect) onFileSelect(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError('Image size should be less than 5MB');
        setFile(null);
        if (onFileSelect) onFileSelect(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setFile(selectedFile);
      setUploadError(null);

      // If this is for Create Listing or Edit Listing, just store the file for later upload
      if ((isCreateListing || isEditListing) && onFileSelect) {
        onFileSelect(selectedFile);
      } else if (!isCreateListing && !isEditListing) {
        // For other cases, upload immediately as before
        handleUpload(selectedFile);
      }
    }
  };

  const handleUpload = async (fileToUpload: File) => {
    if (!fileToUpload) {
      setUploadError('Please select a file first');
      return;
    }

    // Check file size
    if (fileToUpload.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create a toast notification that can be updated
    const toastId = toast.loading('Uploading image...');

    try {
      console.log('Starting image upload for file:', fileToUpload.name, 'size:', Math.round(fileToUpload.size / 1024), 'KB');

      // Process the image to ensure consistent format and size
      let processedFile = fileToUpload;

      if (fileToUpload.type.startsWith('image/')) {
        try {
          // Simple client-side processing by creating a canvas
          const img = new Image();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Create a promise to handle the image loading
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              // Calculate dimensions (max 1200px width/height)
              const maxDimension = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height && width > maxDimension) {
                height = Math.round(height * (maxDimension / width));
                width = maxDimension;
              } else if (height > maxDimension) {
                width = Math.round(width * (maxDimension / height));
                height = maxDimension;
              }

              canvas.width = width;
              canvas.height = height;

              // Draw the image on the canvas with the new dimensions
              ctx?.drawImage(img, 0, 0, width, height);

              // Convert canvas to blob with appropriate quality
              // Use higher quality for smaller images, lower for larger ones
              const quality = fileToUpload.size < 100 * 1024 ? 0.95 : 0.8;

              canvas.toBlob((blob) => {
                if (blob) {
                  processedFile = new File([blob], fileToUpload.name, {
                    type: 'image/jpeg' // Always convert to JPEG for consistency
                  });
                  console.log('Processed image size:', Math.round(processedFile.size / 1024), 'KB');
                  resolve();
                } else {
                  reject(new Error('Failed to process image'));
                }
              }, 'image/jpeg', quality);
            };

            img.onerror = () => {
              reject(new Error('Failed to load image for processing'));
            };

            // Load the image from the file
            img.src = URL.createObjectURL(fileToUpload);
          });
        } catch (processingError) {
          console.error('Image processing error:', processingError);
          // Continue with the original file if processing fails
        }
      }

      // Update toast to show progress
      toast.loading('Uploading to server...', { id: toastId });

      const imageUrl = await uploadImage(processedFile);
      console.log('Upload successful, received URL:', imageUrl);

      onChange(imageUrl);
      setFile(null);
      if (onFileSelect) onFileSelect(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Update toast to show success
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (error: any) {
      console.error('Upload error:', error);

      // Extract error message from the response if available
      let errorMessage = 'Failed to upload image. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Check for cancellation
      if (error.message && error.message.includes('cancelled')) {
        errorMessage = 'Upload was cancelled due to timeout. Please try again with a smaller image.';
      }

      setUploadError(errorMessage);

      // Update toast to show error
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          mb: 1
        }}
      >
        {/* For Create Listing, don't show tabs */}
        {isCreateListing ? (
          <Box sx={{ p: 1.5 }}>
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '120px'
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
                disabled={uploadInProgress}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CloudUploadIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  {file ? file.name : 'Select an image to upload'}
                </Typography>
              </Box>

              <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                Max file size: 5MB
              </Typography>

              <Button
                variant="outlined"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadInProgress}
                sx={{ py: 0.5, px: 1, fontSize: '0.75rem' }}
              >
                Browse
              </Button>
            </Box>

            {uploadError && (
              <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>
                {uploadError}
              </Alert>
            )}

            {error && !uploadError && (
              <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          /* For Edit Listing, show tabs */
          <>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="image upload tabs"
              variant="fullWidth"
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                '& .MuiTab-root': {
                  py: 0.5,
                  minHeight: '40px'
                }
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CloudUploadIcon fontSize="small" />
                    <span>Upload</span>
                  </Box>
                }
                {...a11yProps(0)}
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LinkIcon fontSize="small" />
                    <span>URL</span>
                  </Box>
                }
                {...a11yProps(1)}
              />
            </Tabs>

            <TabPanel value={tabValue} index={0} sx={{ p: 1.5 }}>
              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  textAlign: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.03),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px'
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  disabled={uploadInProgress}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CloudUploadIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {file ? file.name : 'Select an image to upload'}
                  </Typography>
                </Box>

                <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                  Max file size: 5MB
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadInProgress}
                  sx={{ py: 0.5, px: 1, fontSize: '0.75rem' }}
                >
                  Browse
                </Button>
              </Box>

              {uploadError && (
                <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>
                  {uploadError}
                </Alert>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1} sx={{ p: 1.5 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Image URL"
                    value={urlValue}
                    onChange={handleUrlChange}
                    onBlur={handleUrlBlur}
                    placeholder="https://example.com/image.jpg"
                    error={!!error}
                    helperText={error || "Enter URL and press Tab or click outside to apply"}
                    variant="outlined"
                    InputProps={{ sx: { fontSize: '0.85rem' } }}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </>
        )}
      </Paper>

      {/* Show preview from either the selected file or the existing value */}
      {(previewUrl || value || uploadInProgress) && (
        <Box
          sx={{
            p: 1,
            border: '1px solid',
            borderColor: uploadInProgress ? 'primary.main' : 'divider',
            borderRadius: 1,
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
            {uploadInProgress ? 'Uploading Image...' : 'Image Preview'}
          </Typography>

          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '120px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Show image with opacity reduced during upload */}
            {(previewUrl || value) && (
              <img
                src={previewUrl || value}
                alt="Thumbnail Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '120px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  opacity: uploadInProgress ? 0.5 : 1,
                  transition: 'opacity 0.3s ease'
                }}
                onError={(e) => {
                  const width = 400;
                  const svg = encodeURIComponent(`
                    <svg width="${width}" height="${Math.round(width * 0.66)}"
                         xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="#e0e0e0"/>
                      <text x="50%" y="50%" dominant-baseline="middle"
                            text-anchor="middle" font-family="Arial"
                            font-size="16" fill="#666">
                        Image Preview Not Available
                      </text>
                    </svg>
                  `);
                  e.currentTarget.src = `data:image/svg+xml,${svg}`;
                }}
              />
            )}

            {/* Overlay loading indicator during upload */}
            {uploadInProgress && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 1
                }}
              >
                <CircularProgress size={30} />
                <Typography variant="caption" sx={{ mt: 1, fontWeight: 'medium' }}>
                  Uploading to server...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Status message below the image */}
          {uploadInProgress && (
            <Alert severity="info" sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>
              Your image will be uploaded when you save the listing
            </Alert>
          )}

          {file && !uploadInProgress && (
            <Typography variant="subtitle2" color="primary" sx={{ display: 'block', mt: 0.5 }}>
              Image staged for upload on save
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ImageUpload;
