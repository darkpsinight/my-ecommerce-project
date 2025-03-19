import * as ExifReader from "exifreader";

// Declare OpenCV type for TypeScript
declare global {
  interface Window {
    cv: any;
  }
}

// Screenshot detection utilities
export const screenshotDetection = {
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
export const imageQualityValidation = {
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