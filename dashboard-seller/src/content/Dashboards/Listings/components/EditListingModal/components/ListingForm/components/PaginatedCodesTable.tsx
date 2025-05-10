import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  useTheme,
  alpha,
  Chip,
  Tooltip,
  Badge,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SellIcon from '@mui/icons-material/Sell';
import { format } from 'date-fns';
import { ListingCode } from '../utils/types';
import { deleteListingCode } from 'src/services/api/listings';
import toast from 'react-hot-toast';

interface PaginatedCodesTableProps {
  codes: ListingCode[];
  onDeleteCode: (code: string) => void;
  listingId: string;
  onCodeDeleted?: () => void;
}

const PaginatedCodesTable: React.FC<PaginatedCodesTableProps> = ({
  codes,
  onDeleteCode,
  listingId,
  onCodeDeleted
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Find duplicate codes
  const duplicateCodes = useMemo(() => {
    const codeMap = new Map();
    const duplicates = new Set<string>();

    codes.forEach(codeItem => {
      const code = codeItem.code;
      if (code) {
        if (codeMap.has(code)) {
          duplicates.add(code);
        } else {
          codeMap.set(code, true);
        }
      }
    });

    return duplicates;
  }, [codes]);

  // Count duplicates
  const duplicateCount = duplicateCodes.size;

  // Count invalid codes
  const invalidCodes = useMemo(() => {
    return codes.filter(codeItem => codeItem.isInvalid);
  }, [codes]);

  const invalidCount = invalidCodes.length;

  // Reset to first page when codes array changes
  useEffect(() => {
    setPage(0);
  }, [codes.length]);

  // Filter codes based on search term
  const filteredCodes = useMemo(() => {
    if (!searchTerm.trim()) return codes;

    const term = searchTerm.toLowerCase().trim();
    return codes.filter(code =>
      code.code && code.code.toLowerCase().includes(term)
    );
  }, [codes, searchTerm]);

  // Get current page of codes
  const displayedCodes = useMemo(() => {
    return filteredCodes.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredCodes, page, rowsPerPage]);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when search changes
  };

  // Format date for display
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'No expiration';
    try {
      return format(new Date(date), 'yyyy-MM-dd');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (codes.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No codes added yet. Add at least one product code.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Added Codes ({codes.length})
          </Typography>

          {duplicateCount > 0 && (
            <Tooltip title={`${duplicateCount} duplicate code${duplicateCount > 1 ? 's' : ''} found. Please remove duplicates before submitting.`}>
              <Chip
                icon={<ErrorOutlineIcon />}
                label={`${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''}`}
                color="error"
                size="small"
                sx={{ ml: 1 }}
              />
            </Tooltip>
          )}

          {invalidCount > 0 && (
            <Tooltip title={`${invalidCount} code${invalidCount > 1 ? 's' : ''} don't match the platform pattern. Please remove or correct them before submitting.`}>
              <Chip
                icon={<WarningAmberIcon />}
                label={`${invalidCount} invalid pattern${invalidCount > 1 ? 's' : ''}`}
                color="warning"
                size="small"
                sx={{ ml: 1 }}
              />
            </Tooltip>
          )}
        </Box>
        <TextField
          placeholder="Search codes..."
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: { xs: '100%', sm: '250px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {duplicateCount > 0 && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {duplicateCount} duplicate code{duplicateCount > 1 ? 's' : ''} found. Please remove {duplicateCount > 1 ? 'these duplicates' : 'this duplicate'} before submitting your listing.
        </Alert>
      )}

      {invalidCount > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
        >
          {invalidCount} code{invalidCount > 1 ? 's' : ''} don't match the required pattern for this platform. These codes are highlighted in yellow. Please remove them before submitting your listing.
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 400, overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Expiration</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedCodes.length > 0 ? (
                displayedCodes.map((codeItem, index) => {
                  const isSold = codeItem.soldStatus === 'sold';
                  return (
                    <TableRow
                      key={`code-${index}-${codeItem.codeId || codeItem.code || index}`}
                      sx={{
                        // Apply conditional styling first based on code status
                        ...(codeItem.code && duplicateCodes.has(codeItem.code) && {
                          backgroundColor: `${alpha(theme.palette.error.light, 0.15)} !important`,
                          '&:hover': {
                            backgroundColor: `${alpha(theme.palette.error.light, 0.25)} !important`
                          }
                        }),
                        ...(codeItem.isInvalid && {
                          backgroundColor: `${alpha(theme.palette.warning.light, 0.15)} !important`,
                          '&:hover': {
                            backgroundColor: `${alpha(theme.palette.warning.light, 0.25)} !important`
                          }
                        }),
                        // Then apply default styling if no conditions are met
                        ...((codeItem.code ? !duplicateCodes.has(codeItem.code) : true) && !codeItem.isInvalid && {
                          '&:nth-of-type(odd)': {
                            backgroundColor: alpha(theme.palette.background.default, 0.5)
                          },
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                          }
                        })
                      }}
                    >
                      <TableCell sx={{ maxWidth: { xs: '120px', sm: '200px', md: '300px' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {codeItem.code && duplicateCodes.has(codeItem.code) && (
                            <Tooltip title="Duplicate code - please remove this duplicate before submitting">
                              <ErrorOutlineIcon
                                color="error"
                                fontSize="small"
                                sx={{ mr: 1, flexShrink: 0 }}
                              />
                            </Tooltip>
                          )}
                          {codeItem.isInvalid && (
                            <Tooltip title={codeItem.invalidReason || "This code doesn't match the platform pattern"}>
                              <WarningAmberIcon
                                color="warning"
                                fontSize="small"
                                sx={{ mr: 1, flexShrink: 0 }}
                              />
                            </Tooltip>
                          )}
                          <Tooltip title={codeItem.code || 'Code ID: ' + codeItem.codeId}>
                            <Typography
                              variant="body2"
                              fontFamily="monospace"
                              sx={{
                                fontWeight: 500,
                                wordBreak: 'break-all',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textDecoration: isSold ? 'line-through' : 'none',
                                opacity: isSold ? 0.7 : 1,
                                ...(codeItem.code && duplicateCodes.has(codeItem.code) && {
                                  color: theme.palette.error.main
                                }),
                                ...(codeItem.isInvalid && {
                                  color: theme.palette.warning.dark
                                })
                              }}
                            >
                              {codeItem.code || (codeItem.codeId ? `[Code ID: ${codeItem.codeId.substring(0, 8)}...]` : 'Unknown code')}
                            </Typography>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {isSold ? (
                          <Chip
                            size="small"
                            label={codeItem.soldAt ? `Sold: ${formatDate(codeItem.soldAt)}` : 'Sold'}
                            color="primary"
                            variant="outlined"
                            icon={<SellIcon fontSize="small" />}
                            sx={{ height: 24 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Active"
                            color={codeItem.isInvalid ? "warning" : "success"}
                            variant="outlined"
                            sx={{ height: 24 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {codeItem.expirationDate ? (
                          <Typography variant="body2">
                            {formatDate(codeItem.expirationDate)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No expiration
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: '1%' }}>
                        {!isSold && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={async () => {
                              if (!codeItem.codeId) {
                                // For new codes that don't have a codeId yet, just remove from local state
                                if (codeItem.code) {
                                  onDeleteCode(codeItem.code);
                                } else {
                                  console.warn('Attempted to delete code with no code property and no codeId');
                                }
                                return;
                              }

                              try {
                                // Show loading state
                                const loadingToast = toast.loading('Deleting code...');

                                // Call the API to delete the code
                                const response = await deleteListingCode(listingId, codeItem.codeId);

                                // Dismiss the loading toast
                                toast.dismiss(loadingToast);

                                if (response.success) {
                                  // Show success message
                                  toast.success('Code deleted successfully');

                                  // Update local state
                                  if (codeItem.code) {
                                    onDeleteCode(codeItem.code);
                                  } else {
                                    // If code is undefined, we need to find another way to identify the code
                                    console.warn('Deleted code with no code property, using codeId instead');
                                    // This shouldn't happen in normal operation
                                  }

                                  // Notify parent component that a code was deleted
                                  if (onCodeDeleted) {
                                    onCodeDeleted();
                                  }
                                } else {
                                  // Show error message
                                  toast.error(response.message || 'Failed to delete code');
                                }
                              } catch (error) {
                                console.error('Error deleting code:', error);
                                toast.error('Failed to delete code. Please try again.');
                              }
                            }}
                            aria-label="delete code"
                            title="Delete code"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      No matching codes found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={filteredCodes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Rows per page:
            </Box>
          }
          sx={{
            '.MuiTablePagination-selectLabel': {
              display: { xs: 'none', sm: 'block' }
            },
            '.MuiTablePagination-displayedRows': {
              display: { xs: 'none', sm: 'block' }
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default PaginatedCodesTable;
