import React, { useState, useRef } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Alert,
  AlertTitle,
  Button,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  alpha,
  CircularProgress,
  Tooltip,
  FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CodeIcon from '@mui/icons-material/Code';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { FormData, FormErrors } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer, AddButton } from '../components/StyledComponents';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { validateCodeAgainstPattern, Pattern } from 'src/services/api/validation';
import { uploadCodesCSV } from 'src/services/api/listings';
import { toast } from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`code-entry-tabpanel-${index}`}
      aria-labelledby={`code-entry-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

function a11yProps(index: number) {
  return {
    id: `code-entry-tab-${index}`,
    'aria-controls': `code-entry-tabpanel-${index}`,
  };
}

interface UnifiedProductCodeSectionProps {
  formData: FormData;
  formErrors: FormErrors;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  handleDateChange: (date: Date | null) => void;
  handleAddCode: () => void;
  handleDeleteCode: (codeToDelete: string) => void;
  handleCodeKeyDown: (e: React.KeyboardEvent) => void;
  selectedPattern?: Pattern | null;
  listingId?: string;
  onRefresh?: () => void;
}

const UnifiedProductCodeSection: React.FC<UnifiedProductCodeSectionProps> = ({
  formData,
  formErrors,
  handleTextChange,
  handleDateChange,
  handleAddCode,
  handleDeleteCode,
  handleCodeKeyDown,
  selectedPattern,
  listingId,
  onRefresh
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // File upload handlers
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
    if (!file || !listingId) {
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

        try {
          // Call the API to upload the CSV data
          const response = await uploadCodesCSV(listingId, csvData);

          if (response.success) {
            setSuccess(true);
            setSuccessData(response.data);

            // Reset file input
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }

            // Call onRefresh to update the listing data
            if (onRefresh) {
              onRefresh();
            }
          } else {
            setError(response.message || 'Failed to upload codes');
          }
        } catch (error) {
          console.error('Error uploading CSV:', error);
          setError('An unexpected error occurred. Please try again.');
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

    // Create a blob and download link
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_codes_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <SectionContainer>
      <SectionHeader icon="code" title="Product Codes" />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="code entry methods"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            icon={<CodeIcon />}
            iconPosition="start"
            label="Manual Entry"
            {...a11yProps(0)}
          />
          <Tab
            icon={<UploadFileIcon />}
            iconPosition="start"
            label="Bulk Upload"
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>

      {/* Manual Entry Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.03), borderRadius: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Add a New Code
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Code"
                name="newCode"
                value={formData.newCode}
                onChange={handleTextChange}
                error={!!formErrors.newCode}
                helperText={formErrors.newCode || (selectedPattern ? `Format: ${selectedPattern.description || selectedPattern.regex}. Spaces are not allowed.` : "The code your buyers will receive after purchase. Spaces are not allowed.")}
                variant="outlined"
                required
                placeholder={selectedPattern?.example || "Enter the exact code that buyers will receive"}
                onKeyDown={handleCodeKeyDown}
                size={isMobile ? "small" : "medium"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CodeIcon />
                    </InputAdornment>
                  )
                }}
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
              <DatePicker
                label="Expiration Date (Optional)"
                value={formData.newExpirationDate}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    helperText="Leave blank if the code doesn't expire"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddCode}
                disabled={!formData.newCode.trim() || Boolean(formErrors.newCode)}
                startIcon={<CodeIcon />}
              >
                Add Code
              </Button>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      {/* Bulk Upload Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="textSecondary" paragraph>
            Upload multiple codes at once using a CSV file. The CSV file should have 'code' and 'expirationDate' columns.
            Spaces are not allowed in codes.
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
            Download CSV Template
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
              startIcon={loading ? <CircularProgress size={20} /> : null}
              disabled={!file || loading}
              onClick={handleUpload}
              fullWidth
              sx={{ mb: 2 }}
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

          {success && successData && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <AlertTitle>Success</AlertTitle>
              <Typography variant="body2">
                Added {successData.codesAdded} codes to the listing.
              </Typography>
              <Typography variant="body2">
                Total codes in listing: {successData.totalCodes}
              </Typography>
            </Alert>
          )}
        </Box>
      </TabPanel>
    </SectionContainer>
  );
};

export default UnifiedProductCodeSection;
