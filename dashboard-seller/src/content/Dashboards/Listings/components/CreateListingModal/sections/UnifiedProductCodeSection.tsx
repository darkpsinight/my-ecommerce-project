import React, { useState, useRef } from 'react';
import {
  Box,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  FormHelperText,
  Button,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  alpha,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SectionCard from '../../CreateListingModal/components/SectionCard';
import SectionTitle from '../../CreateListingModal/components/SectionTitle';
import { validateCodeAgainstPattern } from 'src/services/api/validation';

import { CodeItem } from '../types';
import { formatProductCode } from '../../CreateListingModal/utils/formatProductCode';

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
  formData: {
    codes: CodeItem[];
    newCode: string;
    newExpirationDate: string | Date | null;
  };
  formErrors: {
    newCode?: string;
    codes?: string;
  };
  validationError: string | null;
  selectedPattern: {
    example?: string;
    description?: string;
    regex?: string;
  } | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateChange?: (date: Date | null) => void;
  handleAddCode?: () => void;
  handleDeleteCode?: (code: string) => void;
  handleCodeKeyDown?: (e: React.KeyboardEvent) => void;
  setFormData?: React.Dispatch<React.SetStateAction<any>>;
}

/**
 * Unified Product Code section with tabs for manual entry and bulk upload
 */
const UnifiedProductCodeSection: React.FC<UnifiedProductCodeSectionProps> = ({
  formData,
  formErrors,
  validationError,
  selectedPattern,
  handleChange,
  handleDateChange,
  handleAddCode,
  // handleDeleteCode is not used here as the delete functionality is handled in the parent component
  // through the PaginatedCodesTable that's now moved to the bottom of the modal
  handleCodeKeyDown,
  setFormData
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isVerySmallScreen = useMediaQuery('(max-width:380px)');
  const [tabValue, setTabValue] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [duplicatesInCsv, setDuplicatesInCsv] = useState<string[]>([]);
  const [duplicatesWithExisting, setDuplicatesWithExisting] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle code input with formatting
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    // Check for spaces and show error if found
    if (value.includes(' ')) {
      // Create a synthetic event with error
      const errorEvent = {
        target: {
          name: 'newCode_error',
          value: 'Spaces are not allowed in codes'
        }
      };

      // Pass the error to the parent component
      handleChange(errorEvent as React.ChangeEvent<HTMLInputElement>);
    }

    const formattedValue = formatProductCode(value, selectedPattern);

    // Create a synthetic event with the formatted value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'newCode',
        value: formattedValue
      }
    };

    handleChange(syntheticEvent);
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
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setDuplicatesInCsv([]);
    setDuplicatesWithExisting([]);

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

        // Check for duplicates within the CSV file itself
        const uniqueCodesMap = new Map();
        const duplicatesInCsvArray = [];
        const uniqueCodesFromCsv = [];

        // First pass: identify duplicates within the CSV
        parsedCodes.forEach(codeItem => {
          if (uniqueCodesMap.has(codeItem.code)) {
            duplicatesInCsvArray.push(codeItem.code);
          } else {
            uniqueCodesMap.set(codeItem.code, codeItem);
            uniqueCodesFromCsv.push(codeItem);
          }
        });

        // Check for duplicates with existing codes
        const existingCodes = new Set(formData.codes.map(c => c.code));
        const duplicatesWithExistingArray = [];
        const finalCodesToAddArray = [];

        uniqueCodesFromCsv.forEach(codeItem => {
          if (existingCodes.has(codeItem.code)) {
            duplicatesWithExistingArray.push(codeItem.code);
          } else {
            // Validate against the selected pattern if available
            if (selectedPattern && selectedPattern.regex) {
              // Cast selectedPattern to ensure it has required properties
              const validationResult = validateCodeAgainstPattern(
                codeItem.code,
                {
                  regex: selectedPattern.regex || '',
                  description: selectedPattern.description || '',
                  example: selectedPattern.example || ''
                }
              );

              if (!validationResult.isValid) {
                // Mark the code as invalid but still add it
                codeItem.isInvalid = true;
                codeItem.invalidReason = validationResult.reason;
              }
            }

            finalCodesToAddArray.push(codeItem);
          }
        });

        // Update state with the results
        setDuplicatesInCsv(duplicatesInCsvArray);
        setDuplicatesWithExisting(duplicatesWithExistingArray);

        // Update the form data with the unique codes
        if (setFormData && finalCodesToAddArray.length > 0) {
          setFormData({
            ...formData,
            codes: [...formData.codes, ...finalCodesToAddArray]
          });
        }

        // Show appropriate success/warning message
        setFile(null);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Count invalid codes (not used currently but kept for future use)
        // const invalidCodesCount = finalCodesToAddArray.filter(code => code.isInvalid).length;

        // Set appropriate message based on duplicates and invalid codes
        if (finalCodesToAddArray.length === 0) {
          // If no codes were added, show only error
          const totalDuplicates = duplicatesInCsvArray.length + duplicatesWithExistingArray.length;
          setError(`All ${totalDuplicates} codes were duplicates. No new codes were added.`);
          setSuccess(false);
        } else {
          // If some codes were added, show success
          setSuccess(true);
          setError(null);
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

      // Check for spaces in the code
      const code = values[codeIndex];
      if (code.includes(' ')) {
        // Mark the code as invalid due to spaces
        const codeObj: any = {
          code: code,
          soldStatus: 'active',
          isInvalid: true,
          invalidReason: 'Spaces are not allowed in codes'
        };
        result.push(codeObj);
        continue;
      }

      const codeObj: any = {
        code: code,
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
            Product Codes
            <Tooltip
              title="Add product codes that will be delivered to buyers. You can add codes individually or upload them in bulk using a CSV file."
              arrow
            >
              <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                <InfoOutlinedIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Box>
        </SectionTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="code entry methods"
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minWidth: { xs: isVerySmallScreen ? 'auto' : '120px', sm: 'auto' },
                px: { xs: isVerySmallScreen ? 0.5 : 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                whiteSpace: 'nowrap'
              }
            }}
          >
            <Tab
              icon={<CodeIcon />}
              iconPosition="start"
              label={
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    ml: { xs: 0.5, sm: 1 }
                  }}
                >
                  {isVerySmallScreen ? 'Manual' : 'Manual Entry'}
                </Typography>
              }
              {...a11yProps(0)}
            />
            <Tab
              icon={<UploadFileIcon />}
              iconPosition="start"
              label={
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    ml: { xs: 0.5, sm: 1 }
                  }}
                >
                  {isVerySmallScreen ? 'Bulk' : 'Bulk Upload'}
                </Typography>
              }
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
                  onChange={handleCodeChange}
                  placeholder={selectedPattern?.example || "Enter the exact code that buyers will receive"}
                  error={Boolean(formErrors.newCode) || Boolean(validationError)}
                  helperText={
                    formErrors.newCode || validationError ||
                    (selectedPattern ? `Format: ${selectedPattern.description || selectedPattern.regex}. Spaces are not allowed.` : "The code your buyers will receive after purchase. Spaces are not allowed.")
                  }
                  required
                  size={isMobile ? "small" : "medium"}
                  onKeyDown={handleCodeKeyDown}
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
                  disabled={!formData.newCode || Boolean(formErrors.newCode) || Boolean(validationError)}
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
                startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
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

            {success && (
              <Alert
                severity={duplicatesInCsv.length > 0 || duplicatesWithExisting.length > 0 ? "warning" : "success"}
                sx={{ mt: 2 }}
              >
                <AlertTitle>{duplicatesInCsv.length > 0 || duplicatesWithExisting.length > 0 ? "Warning" : "Success"}</AlertTitle>
                {duplicatesInCsv.length > 0 || duplicatesWithExisting.length > 0 ? (
                  <>
                    Codes have been added to your listing.
                    {(duplicatesInCsv.length > 0) || (duplicatesWithExisting.length > 0) ? (
                      <> Skipped {(duplicatesInCsv ? duplicatesInCsv.length : 0) + (duplicatesWithExisting ? duplicatesWithExisting.length : 0)} duplicate {((duplicatesInCsv ? duplicatesInCsv.length : 0) + (duplicatesWithExisting ? duplicatesWithExisting.length : 0)) === 1 ? 'code' : 'codes'}.</>
                    ) : null}
                  </>
                ) : (
                  <>
                    Codes have been successfully added to your listing.
                  </>
                )}
              </Alert>
            )}
          </Box>
        </TabPanel>
      </CardContent>
    </SectionCard>
  );
};

export default UnifiedProductCodeSection;
