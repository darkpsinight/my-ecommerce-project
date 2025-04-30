import { FC } from 'react';
import { TablePagination } from '@mui/material';
import { CodePaginationProps } from './types';

export const CodePagination: FC<CodePaginationProps> = ({ 
  count, 
  page, 
  rowsPerPage, 
  onPageChange, 
  onRowsPerPageChange 
}) => {
  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={onPageChange}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={onRowsPerPageChange}
      rowsPerPageOptions={[5, 10, 25]}
    />
  );
};

export default CodePagination;
