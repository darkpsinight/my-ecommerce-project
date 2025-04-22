import { FC } from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  Checkbox
} from '@mui/material';

interface ListingsTableHeaderProps {
  numSelected: number;
  rowCount: number;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ListingsTableHeader: FC<ListingsTableHeaderProps> = ({
  numSelected,
  rowCount,
  onSelectAllClick
}) => {
  const headers = [
    { id: 'title', label: 'Title', align: 'left' },
    { id: 'platform', label: 'Platform', align: 'left' },
    { id: 'codes', label: 'Codes', align: 'left' },
    { id: 'quantity', label: 'Quantity', align: 'center' },
    { id: 'price', label: 'Price', align: 'left' },
    { id: 'expiration', label: 'Expiration', align: 'left' },
    { id: 'status', label: 'Status', align: 'left' },
    { id: 'created', label: 'Created', align: 'left' },
    { id: 'actions', label: 'Actions', align: 'right' }
  ];

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all listings' }}
          />
        </TableCell>
        {headers.map((header) => (
          <TableCell key={header.id} align={header.align as any}>
            {header.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default ListingsTableHeader;
