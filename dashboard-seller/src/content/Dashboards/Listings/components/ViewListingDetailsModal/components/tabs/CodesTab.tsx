import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
  Paper
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';

import { Listing } from '../../../../types';
import { formatDate } from '../../utils/formatters';

interface CodesTabProps {
  listing: Listing;
  activeCodes: number;
  totalCodes: number;
  copiedCode: string | null;
  handleCopyCode: (code: string) => void;
}

const CodesTab: React.FC<CodesTabProps> = ({
  listing,
  activeCodes,
  totalCodes,
  copiedCode,
  handleCopyCode
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset to first page when codes array changes
  useEffect(() => {
    setPage(0);
  }, [listing.codes?.length]);

  // Filter codes based on search term
  const filteredCodes = useMemo(() => {
    if (!listing.codes) return [];
    if (!searchTerm.trim()) return listing.codes;

    const term = searchTerm.toLowerCase().trim();
    return listing.codes.filter(code =>
      code.code.toLowerCase().includes(term)
    );
  }, [listing.codes, searchTerm]);

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

  return (
    <Card variant="outlined" sx={{ boxShadow: theme.shadows[1] }}>
      <CardContent sx={{ pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <CodeIcon
                sx={{
                  mr: 1,
                  color: theme.palette.primary.main,
                  fontSize: 20
                }}
              />
              Product Codes
            </Typography>

            <Chip
              label={`${activeCodes} Active / ${totalCodes} Total`}
              color={activeCodes > 0 ? 'success' : 'default'}
              size="small"
              sx={{ fontWeight: 500, ml: 1 }}
            />
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
              )
            }}
          />
        </Box>

        <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
          <TableContainer
            sx={{
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              maxHeight: 300
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        0.05
                      )
                    }}
                  >
                    Code
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        0.05
                      )
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        0.05
                      )
                    }}
                  >
                    Sold Date
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        0.05
                      )
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedCodes.length > 0 ? (
                  displayedCodes.map((codeItem, index) => (
                    <TableRow
                      key={`code-${index}-${codeItem.codeId || codeItem.code}`}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: alpha(
                            theme.palette.background.default,
                            0.5
                          )
                        },
                        '&:hover': {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.02
                          )
                        }
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          sx={{ fontWeight: 500 }}
                        >
                          {codeItem.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={codeItem.soldStatus}
                          size="small"
                          color={
                            codeItem.soldStatus === 'active'
                              ? 'success'
                              : codeItem.soldStatus === 'sold'
                              ? 'primary'
                              : 'default'
                          }
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            textTransform: 'capitalize'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {codeItem.soldAt
                            ? formatDate(codeItem.soldAt)
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Copy Code">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCopyCode(codeItem.code)
                            }
                            color={
                              copiedCode === codeItem.code
                                ? 'success'
                                : 'default'
                            }
                          >
                            {copiedCode === codeItem.code ? (
                              <CheckCircleOutlineIcon fontSize="small" />
                            ) : (
                              <ContentCopyIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
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
            rowsPerPageOptions={[5, 10, 25, 50]}
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
      </CardContent>
    </Card>
  );
};

export default CodesTab;
