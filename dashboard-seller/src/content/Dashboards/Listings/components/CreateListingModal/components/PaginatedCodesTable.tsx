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
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { format } from 'date-fns';
import { CodeItem } from '../types';

interface PaginatedCodesTableProps {
  codes: CodeItem[];
  onDeleteCode: (code: string) => void;
}

const PaginatedCodesTable: React.FC<PaginatedCodesTableProps> = ({ codes, onDeleteCode }) => {
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
      if (codeMap.has(code)) {
        duplicates.add(code);
      } else {
        codeMap.set(code, true);
      }
    });

    return duplicates;
  }, [codes]);

  // Count duplicates
  const duplicateCount = duplicateCodes.size;

  // Reset to first page when codes array changes
  useEffect(() => {
    setPage(0);
  }, [codes.length]);

  // Filter codes based on search term
  const filteredCodes = useMemo(() => {
    if (!searchTerm.trim()) return codes;

    const term = searchTerm.toLowerCase().trim();
    return codes.filter(code =>
      code.code.toLowerCase().includes(term)
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

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 400, overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 500 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Expiration Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedCodes.length > 0 ? (
                displayedCodes.map((codeItem, index) => (
                  <TableRow
                    key={`code-${index}-${codeItem.code}`}
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: alpha(theme.palette.background.default, 0.5)
                      },
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      },
                      ...(duplicateCodes.has(codeItem.code) && {
                        backgroundColor: alpha(theme.palette.error.light, 0.15),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.light, 0.25)
                        }
                      })
                    }}
                  >
                    <TableCell sx={{ maxWidth: { xs: '120px', sm: '200px', md: '300px' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {duplicateCodes.has(codeItem.code) && (
                          <Tooltip title="Duplicate code - please remove this duplicate before submitting">
                            <ErrorOutlineIcon
                              color="error"
                              fontSize="small"
                              sx={{ mr: 1, flexShrink: 0 }}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title={codeItem.code}>
                          <Typography
                            variant="body2"
                            fontFamily="monospace"
                            sx={{
                              fontWeight: 500,
                              wordBreak: 'break-all',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              ...(duplicateCodes.has(codeItem.code) && {
                                color: theme.palette.error.main
                              })
                            }}
                          >
                            {codeItem.code}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {codeItem.expirationDate ? (
                        <Chip
                          label={formatDate(codeItem.expirationDate)}
                          size="small"
                          color={duplicateCodes.has(codeItem.code) ? "error" : "primary"}
                          variant="outlined"
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          color={duplicateCodes.has(codeItem.code) ? "error" : "text.secondary"}
                        >
                          No expiration
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: '1%' }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteCode(codeItem.code)}
                        aria-label="delete code"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
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
