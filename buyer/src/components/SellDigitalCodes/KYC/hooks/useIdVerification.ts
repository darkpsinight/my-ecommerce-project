import { useState, useEffect } from 'react';
import { getIdNumberValidation } from '../utils/idValidation';
import { screenshotDetection, imageQualityValidation } from '../utils/imageValidation';

interface UseIdVerificationProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface UseIdVerificationReturn {
  idNumberError: string;
  idNumberPattern: string;
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleIdNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileUploadWithValidation: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleFileRemove: (fieldName: string) => void;
  analyzingField: string | null;
}

export const useIdVerification = ({
  formData,
  handleInputChange,
  handleFileChange,
}: UseIdVerificationProps): UseIdVerificationReturn => {
  const [idNumberError, setIdNumberError] = useState<string>('');
  const [idNumberPattern, setIdNumberPattern] = useState<string>('');
  const [analyzingField, setAnalyzingField] = useState<string | null>(null);
  
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

  // Preload OpenCV when component mounts
  useEffect(() => {
    imageQualityValidation.loadOpenCV().then(loaded => {
      console.log("OpenCV preloaded:", loaded);
    });
  }, []);

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

  // Reset file input value
  const resetFileInput = (inputName: string) => {
    const fileInput = document.getElementById(inputName) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle file upload with image quality validation
  const handleFileUploadWithValidation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const fieldName = e.target.name;
    if (!file) return;
    
    // Check file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert("File size must not exceed 5MB.");
      resetFileInput(fieldName);
      return;
    }
    
    try {
      // Check if it's an image file
      const isImage = file.type.startsWith('image/') || 
                     ['jpg', 'jpeg', 'png'].includes(file.name.split('.').pop()?.toLowerCase() || '');
      
      if (isImage) {
        console.log("Processing image:", file.name, "Size:", file.size, "Type:", file.type);
        
        // Set analyzing state to true for this specific field
        setAnalyzingField(fieldName);
        
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
          setAnalyzingField(null);
          alert("The image appears to be blurry. Please upload a clear photo of your ID.");
          resetFileInput(fieldName);
          return;
        }
        
        // Direct check for "screenshot" in filename (simple check first)
        if (file.name.toLowerCase().includes('screenshot')) {
          setAnalyzingField(null);
          alert("Screenshots are not allowed. Please upload a photo taken with your camera.");
          resetFileInput(fieldName);
          return;
        }
        
        // More thorough screenshot detection
        const isScreenshotFile = await screenshotDetection.isScreenshotByExif(file);
        if (isScreenshotFile === true) {
          setAnalyzingField(null);
          alert("Screenshots are not allowed. Please upload a photo taken with your camera.");
          resetFileInput(fieldName);
          return;
        }
        
        // Check for glare
        console.log("Checking for glare...");
        const hasGlare = await imageQualityValidation.hasGlare(file);
        console.log("Does image have glare?", hasGlare);
        
        if (hasGlare === true) {
          setAnalyzingField(null);
          alert("The image appears to have glare. Please take a photo without reflections or bright spots.");
          resetFileInput(fieldName);
          return;
        }
      }
      
      // If we made it here, all checks passed
      console.log("All image quality checks passed, proceeding with upload");
      handleFileChange(e);
      setAnalyzingField(null);
    } catch (error) {
      console.error("File processing error:", error);
      setAnalyzingField(null);
      alert("Invalid file format. Please upload JPG/PNG images only.");
      resetFileInput(fieldName);
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
    setAnalyzingField(null);
  };

  return {
    idNumberError,
    idNumberPattern,
    handleSelectChange,
    handleIdNumberChange,
    handleFileUploadWithValidation,
    handleFileRemove,
    analyzingField
  };
}; 