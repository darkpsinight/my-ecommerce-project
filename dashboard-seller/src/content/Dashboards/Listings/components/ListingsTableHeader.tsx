import { FC, useContext } from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
  TableSortLabel,
  Box
} from '@mui/material';
import { ListingsContext } from '../context/ListingsContext';

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
  const { sortBy, sortOrder, setSorting } = useContext(ListingsContext);

  // Map frontend column IDs to backend sort fields
  const sortFieldMap = {
    'title': 'title',
    'platform': 'platform',
    'codes': 'codes',
    'quantity': 'quantity',
    'price': 'price',
    'expiration': 'expirationDate',
    'status': 'status',
    'created': 'createdAt'
  };

  const headers = [
    { id: 'title', label: 'Title', align: 'left', sortable: true },
    { id: 'platform', label: 'Platform', align: 'left', sortable: true },
    { id: 'codes', label: 'Codes', align: 'left', sortable: false },
    { id: 'quantity', label: 'Quantity', align: 'center', sortable: true },
    { id: 'price', label: 'Price', align: 'left', sortable: true },
    { id: 'expiration', label: 'Expiration', align: 'left', sortable: true },
    { id: 'status', label: 'Status', align: 'left', sortable: true },
    { id: 'created', label: 'Created', align: 'left', sortable: true },
    { id: 'actions', label: 'Actions', align: 'right', sortable: false }
  ];

  const handleSort = (headerId: string) => {
    if (sortFieldMap[headerId]) {
      setSorting(sortFieldMap[headerId]);
    }
  };

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
            {header.sortable ? (
              <TableSortLabel
                active={sortBy === sortFieldMap[header.id]}
                direction={sortBy === sortFieldMap[header.id] ? sortOrder : 'asc'}
                onClick={() => handleSort(header.id)}
              >
                {header.label}
                {sortBy === sortFieldMap[header.id] ? (
                  <Box component="span" sx={{ border: 0, clip: 'rect(0 0 0 0)', height: 1, margin: -1, overflow: 'hidden', padding: 0, position: 'absolute', whiteSpace: 'nowrap', width: 1 }}>
                    {sortOrder === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              header.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default ListingsTableHeader;
