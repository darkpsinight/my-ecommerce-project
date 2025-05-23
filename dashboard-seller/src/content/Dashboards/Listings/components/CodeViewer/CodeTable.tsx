import { FC } from 'react';
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format } from 'date-fns';
import { CodeTableProps } from './types';
import StatusBadge from '../StatusBadge';

export const CodeTable: FC<CodeTableProps> = ({ currentCodes, copySuccess, handleCopyCode }) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Expiration</TableCell>
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
                  <StatusBadge
                    status={codeObj.soldStatus}
                    type="code"
                    size="small"
                  />
                  {codeObj.soldStatus === 'sold' && codeObj.soldAt && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      {format(new Date(codeObj.soldAt), 'MM/dd/yyyy')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {codeObj.expirationDate
                      ? format(new Date(codeObj.expirationDate), 'yyyy-MM-dd')
                      : 'No expiration'}
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
              <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No codes match your search
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CodeTable;
