import React, { useState, useEffect } from 'react';
import { Box, Slider } from '@mui/material';

// Mock types to match react-easy-crop
export interface Point {
  x: number;
  y: number;
}

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropperProps {
  image: string;
  crop: Point;
  zoom: number;
  aspect: number;
  onCropChange: (location: Point) => void;
  onCropComplete: (cropArea: Area, cropAreaPixels: Area) => void;
  onZoomChange: (zoom: number) => void;
  showGrid?: boolean;
  objectFit?: 'contain' | 'horizontal-cover' | 'vertical-cover';
}

const Cropper: React.FC<CropperProps> = ({
  image,
  crop,
  zoom,
  aspect,
  onCropChange,
  onCropComplete,
  onZoomChange,
  showGrid = false,
  objectFit = 'contain'
}) => {
  const [dragStartPosition, setDragStartPosition] = useState<Point | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Calculate crop area based on current crop position and zoom
  useEffect(() => {
    if (imageSize.width > 0 && imageSize.height > 0) {
      // Get the crop overlay element to determine its actual dimensions
      const cropOverlay = document.querySelector('.crop-overlay');
      let overlayRect = { width: 0, height: 0 };

      if (cropOverlay) {
        const rect = cropOverlay.getBoundingClientRect();
        overlayRect = { width: rect.width, height: rect.height };
        console.log('Actual crop overlay dimensions:', overlayRect);
      }

      // Calculate the crop width and height based on the container size and zoom level
      // If we have the actual overlay dimensions, use those instead
      const cropWidth = overlayRect.width > 0 ?
        (overlayRect.width * imageSize.width) / containerSize.width :
        containerSize.width / zoom;

      const cropHeight = overlayRect.height > 0 ?
        (overlayRect.height * imageSize.height) / containerSize.height :
        cropWidth / aspect;

      // This is the normalized crop area (0-1 values)
      const cropArea: Area = {
        x: 0,
        y: 0,
        width: cropWidth,
        height: cropHeight
      };

      // Calculate the actual pixel coordinates for the crop
      // Use the exact position and dimensions of what's shown in the preview
      const cropAreaPixels: Area = {
        x: Math.max(0, Math.min(imageSize.width - cropWidth, (crop.x + 0.5) * imageSize.width - cropWidth / 2)),
        y: Math.max(0, Math.min(imageSize.height - cropHeight, (crop.y + 0.5) * imageSize.height - cropHeight / 2)),
        width: Math.min(cropWidth, imageSize.width),
        height: Math.min(cropHeight, imageSize.height)
      };

      console.log('Detailed crop calculations:', {
        containerSize,
        imageSize,
        overlayDimensions: overlayRect,
        cropPosition: crop,
        zoom,
        aspect,
        calculatedWidth: cropWidth,
        calculatedHeight: cropHeight,
        finalCropArea: cropAreaPixels
      });

      onCropComplete(cropArea, cropAreaPixels);
    }
  }, [crop, zoom, imageSize, containerSize, aspect, onCropComplete]);

  // Load image dimensions when image changes
  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = image;
    }
  }, [image]);

  // Set container size on mount and update it if the window resizes
  useEffect(() => {
    const updateContainerSize = () => {
      // Get the actual container element
      const container = document.querySelector('.crop-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
        console.log('Container size updated:', { width: rect.width, height: rect.height });
      } else {
        // Fallback to default size if container not found
        setContainerSize({ width: 400, height: 300 });
        console.log('Using default container size');
      }
    };

    // Initial size calculation
    updateContainerSize();

    // Update size on window resize
    window.addEventListener('resize', updateContainerSize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartPosition) {
      const deltaX = (e.clientX - dragStartPosition.x) / containerSize.width;
      const deltaY = (e.clientY - dragStartPosition.y) / containerSize.height;

      onCropChange({
        x: Math.max(-0.5, Math.min(0.5, crop.x - deltaX)),
        y: Math.max(-0.5, Math.min(0.5, crop.y - deltaY))
      });

      setDragStartPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDragStartPosition(null);
  };

  return (
    <Box
      className="crop-container"
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: dragStartPosition ? 'grabbing' : 'grab'
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
          transform: `translate(-50%, -50%) translate(${crop.x * 100}%, ${crop.y * 100}%) scale(${zoom})`,
          transformOrigin: 'center',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src={image}
          alt="Crop preview"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: objectFit === 'contain' ? 'contain' : 'cover',
            pointerEvents: 'none'
          }}
        />
      </Box>

      {/* Crop overlay */}
      <Box
        className="crop-overlay"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${100 / zoom}%`,
          height: `${100 / (zoom * aspect)}%`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          border: '3px solid white',
          pointerEvents: 'none',
          // Add grid lines to help visualize the crop area
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '33.33% 33.33%',
          boxSizing: 'border-box'
        }}
      >
        {/* Corner markers to make the crop area more visible */}
        <Box sx={{ position: 'absolute', top: '-5px', left: '-5px', width: '10px', height: '10px',
                  border: '2px solid white', borderRight: 'none', borderBottom: 'none' }} />
        <Box sx={{ position: 'absolute', top: '-5px', right: '-5px', width: '10px', height: '10px',
                  border: '2px solid white', borderLeft: 'none', borderBottom: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '10px', height: '10px',
                  border: '2px solid white', borderRight: 'none', borderTop: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '10px', height: '10px',
                  border: '2px solid white', borderLeft: 'none', borderTop: 'none' }} />
      </Box>
    </Box>
  );
};

export default Cropper;
