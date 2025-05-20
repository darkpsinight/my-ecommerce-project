import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Typography,
  IconButton,
  Paper,
  useTheme,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
// Import our mock implementation instead of the actual library
import Cropper, { Point, Area } from './MockCropper';

// Helper function to create an image from a canvas
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper function to get the cropped image
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  aspectRatio: number
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  console.log('Original image dimensions:', { width: image.width, height: image.height });
  console.log('Crop parameters:', pixelCrop);
  console.log('Aspect ratio:', aspectRatio);

  // CRITICAL FIX: Use the exact dimensions from the crop area
  // Don't recalculate the height based on aspect ratio - this was causing the zoom issue
  const targetWidth = Math.round(pixelCrop.width);
  const targetHeight = Math.round(pixelCrop.height);

  // Set canvas dimensions to exactly match the cropped area dimensions
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Fill with white background (in case the image has transparency)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw the cropped image onto the canvas
  // The key is to ensure we're extracting exactly what's shown in the preview
  // We use the exact same dimensions for source and destination to prevent any scaling
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Uncomment this to add a border for debugging if needed
  // ctx.strokeStyle = '#FF0000';
  // ctx.lineWidth = 1;
  // ctx.strokeRect(0, 0, targetWidth, targetHeight);

  console.log(`Cropping image from (${pixelCrop.x}, ${pixelCrop.y}, ${pixelCrop.width}, ${pixelCrop.height})`);
  console.log(`Final canvas dimensions: ${targetWidth} x ${targetHeight}`);

  // Create a second canvas that will be used to ensure the final image has the correct aspect ratio
  // This is necessary because the banner container has a fixed aspect ratio
  const finalCanvas = document.createElement('canvas');
  const finalCtx = finalCanvas.getContext('2d');

  if (!finalCtx) {
    throw new Error('No 2d context for final canvas');
  }

  // Calculate dimensions that match the banner's aspect ratio
  const finalWidth = targetWidth;
  const finalHeight = Math.round(finalWidth / aspectRatio);

  // Set final canvas dimensions
  finalCanvas.width = finalWidth;
  finalCanvas.height = finalHeight;

  // Fill with white background
  finalCtx.fillStyle = '#FFFFFF';
  finalCtx.fillRect(0, 0, finalWidth, finalHeight);

  // Calculate positioning to center the image if aspect ratios don't match
  const offsetX = 0;
  const offsetY = (finalHeight - targetHeight) / 2;

  // Draw the cropped image onto the final canvas
  finalCtx.drawImage(canvas, offsetX, offsetY);

  console.log(`Final output dimensions: ${finalWidth} x ${finalHeight}`);

  // Convert canvas to blob with high quality to preserve details
  return new Promise((resolve, reject) => {
    // We need to decide which canvas to use based on the issue we're seeing
    // If the crop is not matching what's shown in the preview, use the original canvas
    // If the aspect ratio is important for the banner, use the finalCanvas

    // For now, let's use the original canvas to ensure we get exactly what was shown in the preview
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }

      // Create a preview URL for debugging
      const previewUrl = URL.createObjectURL(blob);
      console.log('Preview of final cropped image:', previewUrl);

      // Also create a preview of what the aspect-ratio adjusted image would look like
      finalCanvas.toBlob((finalBlob) => {
        if (finalBlob) {
          const finalPreviewUrl = URL.createObjectURL(finalBlob);
          console.log('Preview of aspect-ratio adjusted image:', finalPreviewUrl);
        }

        // Return the original cropped image
        resolve(blob);
      }, 'image/jpeg', 1.0);

    }, 'image/jpeg', 1.0); // Use highest quality
  });
};

interface BannerImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio: number;
  isProcessing?: boolean;
}

const BannerImageCropper: React.FC<BannerImageCropperProps> = ({
  open,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio,
  isProcessing = false
}) => {
  const theme = useTheme();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Load the image when the component mounts or when the imageFile changes
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_: Area, croppedAreaPixelsResult: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsResult);
    },
    []
  );

  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      console.log('Confirming crop with aspect ratio:', aspectRatio);
      console.log('Cropped area pixels:', croppedAreaPixels);

      // Pass the aspect ratio to ensure the cropped image matches the banner dimensions
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, aspectRatio);

      // Create a preview URL for debugging (can be removed in production)
      const previewUrl = URL.createObjectURL(croppedImage);
      console.log('Preview of cropped image:', previewUrl);

      onCropComplete(croppedImage);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 1));
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Position and Crop Banner Image</Typography>
        {!isProcessing && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, position: 'relative', height: 400, bgcolor: 'background.default' }}>
        {imageSrc ? (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={onZoomChange}
            showGrid={true}
            objectFit="horizontal-cover"
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </DialogContent>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleZoomOut} disabled={zoom <= 1 || isProcessing}>
            <ZoomOutIcon />
          </IconButton>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value as number)}
            aria-labelledby="zoom-slider"
            sx={{ mx: 2, flexGrow: 1 }}
            disabled={isProcessing}
          />
          <IconButton onClick={handleZoomIn} disabled={zoom >= 3 || isProcessing}>
            <ZoomInIcon />
          </IconButton>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>
          Drag to reposition • Use slider to zoom • This is how your banner will appear
        </Typography>

        <DialogActions sx={{ px: 0, pb: 0 }}>
          <Button onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmCrop}
            variant="contained"
            disabled={!croppedAreaPixels || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={16} /> : null}
          >
            {isProcessing ? 'Processing...' : 'Apply and Upload'}
          </Button>
        </DialogActions>
      </Paper>
    </Dialog>
  );
};

export default BannerImageCropper;
