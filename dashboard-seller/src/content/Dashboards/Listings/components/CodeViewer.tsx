import { FC, useState, useEffect } from 'react';
import {
  Typography,
  IconButton,
  Box,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { format } from 'date-fns';

interface CodeObject {
  code: string;
  soldStatus: string;
  soldAt?: string | Date;
}

interface CodeViewerProps {
  codes: CodeObject[];
}

export const CodeViewer: FC<CodeViewerProps> = ({ codes }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [filteredCodes, setFilteredCodes] = useState<CodeObject[]>(codes);

  // Filter codes when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCodes(codes);
    } else {
      const filtered = codes.filter(codeObj => 
        codeObj.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCodes(filtered);
    }
    setPage(0); // Reset to first page when search changes
  }, [searchTerm, codes]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSearchTerm('');
    setCopySuccess(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(code);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Get current page of codes
  const currentCodes = filteredCodes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <Tooltip title="View code" arrow>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            py: 0.5,
            px: 1,
            borderRadius: 1,
            cursor: 'pointer',
            width: '100px', // Fixed width to prevent layout shifts
            boxShadow: '0px 9px 16px rgba(159, 162, 191, .18), 0px 2px 2px rgba(159, 162, 191, 0.32)'
          }}
          onClick={handleOpenModal}
        >
          <VisibilityIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            View {codes.length > 1 ? 'codes' : 'code'}
          </Typography>
        </Paper>
      </Tooltip>

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth={"md"}
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {`Product Codes (${filteredCodes.length})`}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            placeholder="Search codes..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentCodes.length > 0 ? (
                  currentCodes.map((codeObj, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {codeObj.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={codeObj.soldStatus === 'active' ? 'success.main' : 
                                codeObj.soldStatus === 'expired' ? 'error.main' : 
                                codeObj.soldStatus === 'draft' ? 'warning.main' : 'text.secondary'}
                        >
                          {codeObj.soldStatus === 'active' ? 'Active' : 
                            codeObj.soldStatus === 'sold' ? `Sold${codeObj.soldAt ? ` on ${format(new Date(codeObj.soldAt), 'MM/dd/yyyy')}` : ''}` : 
                            codeObj.soldStatus === 'expired' ? 'Expired' : 
                            codeObj.soldStatus === 'draft' ? 'Draft' : codeObj.soldStatus}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<ContentCopyIcon />}
                          onClick={() => handleCopyCode(codeObj.code)}
                          color={copySuccess === codeObj.code ? "success" : "primary"}
                        >
                          {copySuccess === codeObj.code ? "Copied!" : "Copy"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No codes match your search
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredCodes.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            These codes are partially masked for security. Only you can see this information.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CodeViewer;
