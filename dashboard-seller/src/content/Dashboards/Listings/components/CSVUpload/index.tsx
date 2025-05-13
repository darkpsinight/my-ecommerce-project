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
  Grid
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { uploadCodesCSV, ValidationErrorResponse } from 'src/services/api/listings';
import { toast } from 'react-hot-toast';

interface CSVUploadProps {
  listingId: string;
  onSuccess?: (data: any) => void;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ listingId, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<any>(null);
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

        // Call the API to upload the CSV data
        const response = await uploadCodesCSV(listingId, csvData);

        if (response.success) {
          setSuccess(true);
          // Check if data exists in the response
          if (response.data) {
            setSuccessData(response.data);

            // Call onSuccess callback if provided
            if (onSuccess) {
              onSuccess(response.data);
            }
          } else {
            // Fallback for older API responses
            setSuccessData({
              codesAdded: 0,
              totalCodes: 0
            });

            if (onSuccess) {
              onSuccess({
                codesAdded: 0,
                totalCodes: 0
              });
            }
          }

          setFile(null);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          // Show success toast
          toast.success(response.message || 'Codes uploaded successfully');
        } else {
          setError(response.message || 'Failed to upload codes');
          toast.error(response.message || 'Failed to upload codes');
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
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Upload Codes from CSV
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12}>
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

          <Typography variant="body2" color="text.secondary" paragraph>
            The <strong>code</strong> column is required. The <strong>expirationDate</strong> column is optional.
            Leave the expiration date empty for codes that don't expire.
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            sx={{ mb: 2 }}
          >
            Download Template
          </Button>
        </Grid>

        <Grid item xs={12}>
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
        </Grid>

        {file && (
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              fullWidth
            >
              {loading ? 'Uploading...' : 'Upload Codes'}
            </Button>
          </Grid>
        )}

        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          </Grid>
        )}

        {success && successData && (
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircleOutlineIcon />}>
              <AlertTitle>Success</AlertTitle>
              <Typography variant="body2">
                Added {successData.codesAdded} codes to the listing.
              </Typography>
              <Typography variant="body2">
                Total codes in listing: {successData.totalCodes}
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CSVUpload;
