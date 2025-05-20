import React, { useState, useRef, useEffect } from 'react';
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

interface SimpleBannerCropperProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio: number;
  isProcessing?: boolean;
}

const SimpleBannerCropper: React.FC<SimpleBannerCropperProps> = ({
  open,
  onClose,
  imageFile,
  onCropComplete,
  aspectRatio,
  isProcessing = false
}) => {
  const theme = useTheme();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load the image when the component mounts or when the imageFile changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);

        // Reset zoom and position when a new image is loaded
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      });
      reader.readAsDataURL(imageFile);
    } else {
      // Reset state when imageFile is null (modal closed)
      setImageSrc(null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [imageFile]);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (!open) {
      // Reset state when modal is closed
      setImageSrc(null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  // Get image dimensions when image loads
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        console.log('Image loaded with dimensions:', { width: img.width, height: img.height });
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isProcessing) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isProcessing) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Calculate new position with constraints
    const container = containerRef.current;
    const image = imageRef.current;

    if (container && image) {
      const containerRect = container.getBoundingClientRect();

      // Calculate the scaled image dimensions
      const scaledWidth = imageSize.width * zoom;
      const scaledHeight = imageSize.height * zoom;

      // Calculate the maximum allowed movement
      const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
      const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);

      setPosition({
        x: Math.max(-maxX, Math.min(maxX, position.x + deltaX)),
        y: Math.max(-maxY, Math.min(maxY, position.y + deltaY))
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    if (isProcessing) return;
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    if (isProcessing) return;
    setZoom(prev => Math.max(prev - 0.1, 1));
  };

  // Function to crop the image using canvas
  const cropImage = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageSrc || !containerRef.current || !imageRef.current) {
        reject(new Error('Missing required elements'));
        return;
      }

      try {
        // Get container dimensions
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        console.log('Container dimensions:', { width: containerWidth, height: containerHeight });
        console.log('Image position:', position);
        console.log('Zoom level:', zoom);

        // Create a canvas with the exact dimensions of the visible area
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas dimensions to match the container's aspect ratio
        // Use a higher resolution for better quality
        const scale = 2; // Increase resolution for better quality
        canvas.width = containerWidth * scale;
        canvas.height = containerHeight * scale;

        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate the image position and dimensions
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS issues

        img.onload = () => {
          console.log('Original image dimensions:', { width: img.width, height: img.height });

          // Calculate the scaled dimensions
          const scaledWidth = img.width * zoom * scale;
          const scaledHeight = img.height * zoom * scale;

          // Calculate the position to center the image
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          // Calculate the position offset based on the current position
          const offsetX = position.x * scale;
          const offsetY = position.y * scale;

          console.log('Drawing image with parameters:', {
            scaledWidth,
            scaledHeight,
            centerX,
            centerY,
            offsetX,
            offsetY
          });

          // Draw the image at the correct position and scale
          ctx.drawImage(
            img,
            0, 0, img.width, img.height, // Source rectangle
            centerX - (scaledWidth / 2) + offsetX, // X position
            centerY - (scaledHeight / 2) + offsetY, // Y position
            scaledWidth,
            scaledHeight
          );

          // Add a small border to visualize the crop area (for debugging)
          // ctx.strokeStyle = '#FF0000';
          // ctx.lineWidth = 2 * scale;
          // ctx.strokeRect(0, 0, canvas.width, canvas.height);

          // Convert to blob
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }

            // Create a preview URL for debugging
            const previewUrl = URL.createObjectURL(blob);
            console.log('Preview of cropped image:', previewUrl);

            resolve(blob);
          }, 'image/jpeg', 0.95); // Slightly reduce quality for better file size
        };

        img.onerror = (error) => {
          console.error('Error loading image:', error);
          reject(new Error('Failed to load image for cropping'));
        };

        img.src = imageSrc;
      } catch (error) {
        console.error('Error cropping image:', error);
        reject(error);
      }
    });
  };

  const handleConfirmCrop = async () => {
    if (isProcessing) return;

    try {
      const croppedBlob = await cropImage();
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error during crop confirmation:', error);
    }
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
          <Box
            ref={containerRef}
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              backgroundColor: '#000'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translateX(${position.x}px) translateY(${position.y}px)`,
                width: `${zoom * 100}%`,
                height: `${zoom * 100}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Banner preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // Changed from 'contain' to 'cover' to better match final result
                  pointerEvents: 'none',
                  transition: 'transform 0.1s ease-out' // Add smooth transition for zoom
                }}
                onLoad={(e) => {
                  // Update image size when it loads
                  const img = e.target as HTMLImageElement;
                  setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                }}
              />
            </Box>

            {/* Overlay to show the visible area */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                border: '3px solid white',
                boxSizing: 'border-box',
                pointerEvents: 'none',
                // Add grid lines
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                backgroundSize: '33.33% 33.33%',
                // Add a subtle shadow inside the frame
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
                // Add a message to indicate this is the visible area
                '&::after': {
                  content: '"This is how your banner will appear"',
                  position: 'absolute',
                  bottom: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }
              }}
            >
              {/* Corner markers */}
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '15px', height: '15px',
                        border: '3px solid white', borderRight: 'none', borderBottom: 'none' }} />
              <Box sx={{ position: 'absolute', top: 0, right: 0, width: '15px', height: '15px',
                        border: '3px solid white', borderLeft: 'none', borderBottom: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '15px', height: '15px',
                        border: '3px solid white', borderRight: 'none', borderTop: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: '15px', height: '15px',
                        border: '3px solid white', borderLeft: 'none', borderTop: 'none' }} />
            </Box>
          </Box>
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
            disabled={!imageSrc || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={16} /> : null}
          >
            {isProcessing ? 'Processing...' : 'Apply and Upload'}
          </Button>
        </DialogActions>
      </Paper>
    </Dialog>
  );
};

export default SimpleBannerCropper;
