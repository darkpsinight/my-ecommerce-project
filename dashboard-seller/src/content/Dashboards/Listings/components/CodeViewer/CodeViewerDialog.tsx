import { FC } from 'react';
import {
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeSearch from './CodeSearch';
import CodeTable from './CodeTable';
import CodePagination from './CodePagination';
import { CodeObject } from './types';

interface CodeViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filteredCodes: CodeObject[];
  searchTerm: string;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentCodes: CodeObject[];
  copySuccess: string | null;
  handleCopyCode: (code: string) => void;
  page: number;
  rowsPerPage: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CodeViewerDialog: FC<CodeViewerDialogProps> = ({
  isOpen,
  onClose,
  filteredCodes,
  searchTerm,
  handleSearchChange,
  currentCodes,
  copySuccess,
  handleCopyCode,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={"md"}
      fullWidth
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {`Product Codes (${filteredCodes.length})`}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <CodeSearch 
          searchTerm={searchTerm}
          handleSearchChange={handleSearchChange}
        />
        <CodeTable 
          currentCodes={currentCodes}
          copySuccess={copySuccess}
          handleCopyCode={handleCopyCode}
        />
        <CodePagination
          count={filteredCodes.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          These codes are partially masked for security. Only you can see this information.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CodeViewerDialog;
