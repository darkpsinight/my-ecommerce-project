import { FC } from 'react';
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format } from 'date-fns';
import { CodeTableProps } from './types';

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
                  <Typography
                    variant="body2"
                    color={codeObj.soldStatus === 'active' ? 'success.main' :
                          codeObj.soldStatus === 'expired' ? 'error.main' :
                          codeObj.soldStatus === 'draft' ? 'warning.main' : 'text.secondary'}
                  >
                    {codeObj.soldStatus === 'active' ? 'On Sale' :
                      codeObj.soldStatus === 'sold' ? `Sold${codeObj.soldAt ? ` on ${format(new Date(codeObj.soldAt), 'MM/dd/yyyy')}` : ''}` :
                      codeObj.soldStatus === 'expired' ? 'Expired' :
                      codeObj.soldStatus === 'draft' ? 'Draft' : codeObj.soldStatus}
                  </Typography>
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
