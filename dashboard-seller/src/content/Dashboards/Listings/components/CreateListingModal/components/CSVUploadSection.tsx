import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Link,
  Divider,
  Grid,
  CardContent,
  useTheme,
  alpha,
  Tooltip,
  IconButton
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { SectionCard, SectionTitle } from './StyledComponents';
import { useModalContext } from '../ModalContext';

/**
 * CSV Upload Section for the Create New Listing modal
 * This component allows users to download a CSV template and prepare codes for upload
 */
const CSVUploadSection: React.FC = () => {
  const theme = useTheme();
  const { formData, setFormData } = useModalContext();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a CSV file
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a CSV file');
        setFile(null);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Read the file content
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const csvData = event.target?.result as string;
        
        // Parse the CSV data
        const parsedCodes = parseCSV(csvData);
        
        if (parsedCodes.length === 0) {
          setError('No valid codes found in the CSV file');
          setLoading(false);
          return;
        }
        
        // Update the form data with the parsed codes
        setFormData({
          ...formData,
          codes: [...formData.codes, ...parsedCodes]
        });
        
        setSuccess(true);
        setFile(null);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setLoading(false);
      };
      
      reader.onerror = () => {
        setError('Failed to read the file');
        setLoading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Parse CSV data into an array of code objects
  const parseCSV = (csvData: string) => {
    const lines = csvData.split('\n');
    const result = [];
    
    // Find the header line
    const headerLine = lines.find(line => line.toLowerCase().includes('code') && line.toLowerCase().includes('expirationdate'));
    
    if (!headerLine) {
      setError('Invalid CSV format. The file must have "code" and "expirationDate" columns.');
      return [];
    }
    
    const headers = headerLine.split(',').map(header => header.trim().toLowerCase());
    const codeIndex = headers.indexOf('code');
    const expirationDateIndex = headers.indexOf('expirationdate');
    
    if (codeIndex === -1) {
      setError('Invalid CSV format. The file must have a "code" column.');
      return [];
    }
    
    // Process data lines
    for (let i = 0; i < lines.length; i++) {
      // Skip empty lines and the header line
      if (lines[i].trim() === '' || lines[i] === headerLine) {
        continue;
      }
      
      const values = lines[i].split(',').map(value => value.trim());
      
      // Skip if there's no code
      if (!values[codeIndex]) {
        continue;
      }
      
      const codeObj: any = {
        code: values[codeIndex],
        soldStatus: 'active'
      };
      
      // Add expiration date if it exists
      if (expirationDateIndex !== -1 && values[expirationDateIndex]) {
        const expirationDate = values[expirationDateIndex];
        
        // Convert to ISO format if it's not already
        if (expirationDate.includes('T')) {
          codeObj.expirationDate = expirationDate;
        } else {
          // Add time component to make it a valid ISO date
          codeObj.expirationDate = `${expirationDate}T23:59:59.999Z`;
        }
      }
      
      result.push(codeObj);
    }
    
    return result;
  };

  const handleDownloadTemplate = () => {
    // Create CSV template content
    const templateContent = 'code,expirationDate\ncode1,2025-12-31\ncode2,2026-12-31\ncode3,';
    
    // Create a blob from the content
    const blob = new Blob([templateContent], { type: 'text/csv' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codes_template.csv';
    
    // Append the link to the document
    document.body.appendChild(link);
    
    // Click the link to trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <SectionCard>
      <CardContent>
        <SectionTitle variant="h6">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            Bulk Upload Codes
            <Tooltip
              title="Upload multiple codes at once using a CSV file. The CSV file should have 'code' and 'expirationDate' columns."
              arrow
            >
              <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                <InfoOutlinedIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Box>
        </SectionTitle>
        
        <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.03), borderRadius: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            CSV Format
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload a CSV file with codes and optional expiration dates. The CSV file should have the following columns:
          </Typography>
          
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" fontFamily="monospace">
              code,expirationDate
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              code1,2025-12-31
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              code2,2026-12-31
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              code3,
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            sx={{ mb: 2 }}
          >
            Download Template
          </Button>
          
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              mb: 2
            }}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            
            <UploadFileIcon sx={{ fontSize: 48, color: 'action.active', mb: 1 }} />
            
            <Typography variant="body1" gutterBottom>
              {file ? file.name : 'Select a CSV file to upload'}
            </Typography>
            
            <Button
              variant="contained"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              sx={{ mt: 1 }}
            >
              Browse Files
            </Button>
          </Box>
          
          {file && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              fullWidth
            >
              {loading ? 'Processing...' : 'Process Codes'}
            </Button>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <AlertTitle>Success</AlertTitle>
              Codes have been added to your listing.
            </Alert>
          )}
        </Box>
      </CardContent>
    </SectionCard>
  );
};

export default CSVUploadSection;
