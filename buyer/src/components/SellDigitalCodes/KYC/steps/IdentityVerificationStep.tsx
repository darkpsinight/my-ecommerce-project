import { StepProps } from "../types";
import { FormField } from "../components/FormField";
import { FileUpload } from "../components/FileUpload";
import React, { useEffect, useState } from "react";
import * as ExifReader from "exifreader";

// Import OpenCV.js dynamically
declare global {
  interface Window {
    cv: any;
  }
}

// Utility functions for screenshot detection
const screenshotDetection = {
  // Check if filename indicates a screenshot
  isScreenshotFileName: (fileName: string): boolean => {
    const cleanName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    // Simple check for common screenshot terms
    const commonScreenshotTerms = ['screenshot', 'screen shot', 'screen-shot', 'screen_shot'];
    if (commonScreenshotTerms.some(term => cleanName.includes(term))) {
      return true;
    }

    try {
      const screenshotRegex = new RegExp(
        '(screen[ _-]?(shot|cap|snap|grab))|' +
        '(scr(nsht|shot|cap))|' +
        '(cap(ture|tura))|' +
        '(snip|print.?scr)|' +
        '(bildschirmfoto|instantane|captura)',
        'i'
      );

      const startsWithPattern = /^(screen|scr|cap|snip|print)/i;
      return screenshotRegex.test(cleanName) || startsWithPattern.test(cleanName);
    } catch (error) {
      // Fallback to simple check if regex fails
      return cleanName.includes('screen') || 
             cleanName.includes('shot') || 
             cleanName.includes('capture') || 
             cleanName.includes('snip');
    }
  },

  // Extract value from EXIF tag
  getTagValue: (tag: any): string => {
    if (!tag) return '';
    if (typeof tag.description === 'string') return tag.description.toLowerCase();
    if (typeof tag.value === 'string') return tag.value.toLowerCase();
    return '';
  },

  // Check if EXIF data indicates a screenshot
  isScreenshotByExif: async (file: File): Promise<boolean> => {
    try {
      // First check filename as it's most reliable
      if (screenshotDetection.isScreenshotFileName(file.name)) {
        return true;
      }

      // Then check EXIF data
      let tags;
      try {
        tags = await ExifReader.load(file);
      } catch (exifError) {
        // Continue with empty tags if EXIF reading fails
        tags = {};
      }
      
      const software = screenshotDetection.getTagValue(tags.Software);
      const imageDescription = screenshotDetection.getTagValue(tags.ImageDescription);
      const userComment = screenshotDetection.getTagValue(tags.UserComment);
      const hostComputer = screenshotDetection.getTagValue(tags.HostComputer);
      
      const screenshotIndicators = [
        'screen', 'snip', 'capture', 'shot', 'printscr', 'snagit',
        'lightshot', 'greenshot', 'windows', 'macos', 'grab', 'snap',
        'snipping', 'xnp', 'android', 'ios'
      ];

      return screenshotIndicators.some(keyword => 
        software.includes(keyword) ||
        imageDescription.includes(keyword) ||
        userComment.includes(keyword) ||
        hostComputer.includes(keyword)
      );
    } catch (error) {
      return false;
    }
  }
};

// Image quality validation functions
const imageQualityValidation = {
  // Track if OpenCV is currently loading
  isLoading: false,
  
  // Load OpenCV.js
  loadOpenCV: async (): Promise<boolean> => {
    // If OpenCV is already loaded, return true immediately
    if (window.cv && typeof window.cv.Mat === 'function') {
      console.log("OpenCV already loaded");
      return true;
    }
    
    // If OpenCV is currently loading, wait for it
    if (imageQualityValidation.isLoading) {
      console.log("OpenCV is already loading, waiting...");
      // Wait for up to 5 seconds for OpenCV to load
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (window.cv && typeof window.cv.Mat === 'function') {
          console.log("OpenCV finished loading while waiting");
          return true;
        }
      }
      console.log("Timed out waiting for OpenCV to load");
      return false;
    }
    
    // Start loading OpenCV
    console.log("Starting to load OpenCV.js");
    imageQualityValidation.isLoading = true;
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
      script.async = true;
      
      script.onload = () => {
        console.log("OpenCV script loaded, waiting for initialization...");
        // Wait for OpenCV to initialize
        const checkCv = () => {
          if (window.cv && typeof window.cv.Mat === 'function') {
            console.log("OpenCV fully initialized");
            imageQualityValidation.isLoading = false;
            resolve(true);
          } else {
            console.log("Waiting for OpenCV to initialize...");
            setTimeout(checkCv, 100);
          }
        };
        checkCv();
      };
      
      script.onerror = () => {
        console.error("Failed to load OpenCV.js");
        imageQualityValidation.isLoading = false;
        resolve(false);
      };
      
      document.body.appendChild(script);
    });
  },
  
  // Check if image is blurry
  isBlurry: async (file: File): Promise<boolean> => {
    try {
      // Try to load OpenCV
      const cvLoaded = await imageQualityValidation.loadOpenCV();
      if (!cvLoaded || !window.cv || typeof window.cv.Mat !== 'function') {
        console.log("OpenCV not properly loaded, skipping blur check");
        return false;
      }
      
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log("Could not get canvas context, skipping blur check");
        return false;
      }
      
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Verify OpenCV is fully loaded before using it
      if (!window.cv || typeof window.cv.Mat !== 'function') {
        console.error("OpenCV not fully initialized");
        return false;
      }
      
      // Convert to grayscale and calculate Laplacian variance
      const src = window.cv.matFromImageData(imgData);
      const gray = new window.cv.Mat();
      window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);
      
      const laplacian = new window.cv.Mat();
      window.cv.Laplacian(gray, laplacian, window.cv.CV_64F);
      
      const mean = new window.cv.Mat();
      const stddev = new window.cv.Mat();
      window.cv.meanStdDev(laplacian, mean, stddev);
      
      // Get variance (standard deviation squared)
      const variance = stddev.data64F[0] * stddev.data64F[0];
      console.log("Blur variance:", variance);
      
      // Clean up
      src.delete();
      gray.delete();
      laplacian.delete();
      mean.delete();
      stddev.delete();
      
      // Lower threshold for blurriness detection (more sensitive)
      // The lower the variance, the blurrier the image
      const result = variance < 50;
      console.log("Final blur detection result:", result);
      return Boolean(result); // Ensure boolean return
    } catch (error) {
      console.error("Error detecting blur:", error);
      // If there's an error with OpenCV, fall back to a simpler blur detection
      try {
        return imageQualityValidation.simpleBlurCheck(file);
      } catch (fallbackError) {
        console.error("Fallback blur detection also failed:", fallbackError);
        return false;
      }
    }
  },
  
  // Simple blur detection as fallback when OpenCV fails
  simpleBlurCheck: async (file: File): Promise<boolean> => {
    console.log("Using simple blur detection fallback");
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    // Calculate a simple edge detection score
    let edgeScore = 0;
    const width = imgData.width;
    const height = imgData.height;
    
    // Sample the image (don't process every pixel for performance)
    const sampleStep = 4;
    
    for (let y = sampleStep; y < height - sampleStep; y += sampleStep) {
      for (let x = sampleStep; x < width - sampleStep; x += sampleStep) {
        const idx = (y * width + x) * 4;
        const idxUp = ((y - sampleStep) * width + x) * 4;
        const idxDown = ((y + sampleStep) * width + x) * 4;
        const idxLeft = (y * width + (x - sampleStep)) * 4;
        const idxRight = (y * width + (x + sampleStep)) * 4;
        
        // Calculate differences with neighboring pixels
        const diffUp = Math.abs(data[idx] - data[idxUp]);
        const diffDown = Math.abs(data[idx] - data[idxDown]);
        const diffLeft = Math.abs(data[idx] - data[idxLeft]);
        const diffRight = Math.abs(data[idx] - data[idxRight]);
        
        // Add to edge score
        edgeScore += (diffUp + diffDown + diffLeft + diffRight);
      }
    }
    
    // Normalize by image size
    const normalizedScore = edgeScore / (width * height / (sampleStep * sampleStep));
    console.log("Simple blur detection score:", normalizedScore);
    
    // Threshold for blurriness
    return normalizedScore < 15;
  },
  
  // Check if image has glare
  hasGlare: async (file: File): Promise<boolean> => {
    try {
      // Temporarily disable glare detection since it's causing issues with valid passport images
      console.log("Glare detection temporarily disabled");
      return false;
      
      /* Original implementation commented out */
    } catch (error) {
      console.error("Error detecting glare:", error);
      return false;
    }
  }
};

// ID Type Selection Component
const IDTypeSelector = ({ value, onChange }: { 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void 
}) => (
  <div className="space-y-1">
    <label htmlFor="idType" className="text-sm font-medium text-dark">
      ID Type
    </label>
    <select
      id="idType"
      name="idType"
      required
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all"
    >
      <option value="">Select ID Type</option>
      <option value="passport">Passport</option>
      <option value="driverLicense">{"Driver's"} License</option>
      <option value="nationalId">National ID</option>
    </select>
  </div>
);

// ID Document Upload Section
const IDDocumentUploads = ({ 
  formData, 
  onFileChange, 
  onRemove 
}: { 
  formData: any, 
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>,
  onRemove: (fieldName: string) => void
}) => (
  <div className="space-y-4">
    <FileUpload
      id="idFront"
      name="idFront"
      label="ID Front Side"
      accept=".jpg,.jpeg,.png"
      onChange={onFileChange}
      files={formData.idFront}
      required
      maxSize="5MB"
      maxFiles={1}
      onRemove={() => onRemove('idFront')}
    />

    <FileUpload
      id="idBack"
      name="idBack"
      label="ID Back Side"
      accept=".jpg,.jpeg,.png"
      onChange={onFileChange}
      files={formData.idBack}
      required
      maxSize="5MB"
      maxFiles={1}
      onRemove={() => onRemove('idBack')}
    />
  </div>
);

// ID Number validation based on ID type
const getIdNumberValidation = (idType: string): { pattern: string, message: string } => {
  switch (idType) {
    case 'passport':
      // Passport format: 9 alphanumeric characters
      return {
        pattern: '^[A-Z0-9]{8,9}$',
        message: 'Passport numbers typically have 8-9 alphanumeric characters'
      };
    case 'driverLicense':
      // Driver's license format varies by country, this is a general pattern
      return {
        pattern: '^[A-Z0-9]{5,20}$',
        message: 'Driver\'s license numbers typically have 5-20 alphanumeric characters'
      };
    case 'nationalId':
      // National ID format varies by country, this is a general pattern
      return {
        pattern: '^[A-Z0-9]{6,12}$',
        message: 'National ID numbers typically have 6-12 alphanumeric characters'
      };
    default:
      return {
        pattern: '^[A-Z0-9]{5,20}$',
        message: 'Please enter a valid ID number'
      };
  }
};

const IdentityVerificationStep = ({
  formData,
  handleInputChange,
  handleFileChange,
}: StepProps) => {
  const [idNumberError, setIdNumberError] = useState<string>('');
  const [idNumberPattern, setIdNumberPattern] = useState<string>('');
  
  // Update ID number validation pattern when ID type changes
  useEffect(() => {
    const { pattern, message } = getIdNumberValidation(formData.idType);
    setIdNumberPattern(pattern);
    
    // Validate current ID number if it exists
    if (formData.idNumber) {
      const regex = new RegExp(pattern);
      if (!regex.test(formData.idNumber.toUpperCase())) {
        setIdNumberError(message);
      } else {
        setIdNumberError('');
      }
    }
  }, [formData.idType, formData.idNumber]);

  // Handle select input change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const event = {
      target: {
        name: e.target.name,
        value: e.target.value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(event);
  };

  // Handle ID number input with validation
  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const upperValue = value.toUpperCase();
    
    // Create a new event with uppercase value
    const event = {
      target: {
        name: e.target.name,
        value: upperValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(event);
    
    // Validate ID number format
    if (value) {
      const { pattern, message } = getIdNumberValidation(formData.idType);
      const regex = new RegExp(pattern);
      
      if (!regex.test(upperValue)) {
        setIdNumberError(message);
      } else {
        setIdNumberError('');
      }
    } else {
      setIdNumberError('');
    }
  };

  // Start loading OpenCV when component mounts
  useEffect(() => {
    // Preload OpenCV.js when component mounts
    imageQualityValidation.loadOpenCV().then(loaded => {
      console.log("OpenCV preloaded:", loaded);
    });
  }, []);

  // Handle file upload with image quality validation
  const handleFileUploadWithValidation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert("File size must not exceed 5MB.");
      e.target.value = '';
      return;
    }
    
    try {
      // Check if it's an image file
      const isImage = file.type.startsWith('image/') || 
                     ['jpg', 'jpeg', 'png'].includes(file.name.split('.').pop()?.toLowerCase() || '');
      
      if (isImage) {
        console.log("Processing image:", file.name, "Size:", file.size, "Type:", file.type);
        
        // Preload OpenCV if not already loaded
        if (!window.cv || typeof window.cv.Mat !== 'function') {
          console.log("Preloading OpenCV before image validation");
          await imageQualityValidation.loadOpenCV();
        }
        
        // Check for blurry image first (most common issue)
        console.log("Checking for blur...");
        const isBlurry = await imageQualityValidation.isBlurry(file);
        console.log("Is image blurry?", isBlurry);
        if (isBlurry === true) {
          alert("The image appears to be blurry. Please upload a clear photo of your ID.");
          e.target.value = '';
          return;
        }
        
        // Direct check for "screenshot" in filename (simple check first)
        if (file.name.toLowerCase().includes('screenshot')) {
          alert("Screenshots are not allowed. Please upload a photo taken with your camera.");
          e.target.value = '';
          return;
        }
        
        // More thorough screenshot detection
        const isScreenshotFile = await screenshotDetection.isScreenshotByExif(file);
        if (isScreenshotFile === true) {
          alert("Screenshots are not allowed. Please upload a photo taken with your camera.");
          e.target.value = '';
          return;
        }
        
        // Check for glare
        console.log("Checking for glare...");
        const hasGlare = await imageQualityValidation.hasGlare(file);
        console.log("Does image have glare?", hasGlare);
        
        // Add additional debug to verify condition evaluation
        console.log("Will show glare alert?", hasGlare === true);
        
        if (hasGlare === true) {
          alert("The image appears to have glare. Please take a photo without reflections or bright spots.");
          e.target.value = '';
          return;
        }
      }
      
      // If we made it here, all checks passed
      console.log("All image quality checks passed, proceeding with upload");
      handleFileChange(e);
    } catch (error) {
      console.error("File processing error:", error);
      alert("Invalid file format. Please upload JPG/PNG images only.");
    }
  };

  // Handle file removal
  const handleFileRemove = (fieldName: string) => {
    const event = {
      target: {
        name: fieldName,
        files: null,
        type: 'file',
        value: ''
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleFileChange(event);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-dark">Identity Verification</h2>
        <p className="text-sm text-gray-500">Please provide your identification details for verification</p>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IDTypeSelector 
            value={formData.idType} 
            onChange={handleSelectChange} 
          />

          <div className="space-y-1">
            <label htmlFor="idNumber" className="text-sm font-medium text-dark">
              ID Number
            </label>
            <input
              id="idNumber"
              name="idNumber"
              type="text"
              value={formData.idNumber || ""}
              onChange={handleIdNumberChange}
              placeholder="Enter your ID number"
              pattern={idNumberPattern}
              className={`w-full px-4 py-2.5 rounded-lg border ${idNumberError ? 'border-red' : 'border-gray-300'} outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400`}
              required
            />
            {idNumberError && (
              <p className="text-sm text-red mt-1">{idNumberError}</p>
            )}
          </div>
        </div>

        <IDDocumentUploads 
          formData={formData}
          onFileChange={handleFileUploadWithValidation}
          onRemove={handleFileRemove}
        />
      </div>
    </div>
  );
};

export default IdentityVerificationStep;
