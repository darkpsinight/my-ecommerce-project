import { FC, useContext } from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  Checkbox,
  TableSortLabel,
  Box,
  Tooltip
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
    { id: 'title', label: 'TITLE', align: 'left', sortable: true },
    { id: 'platform', label: 'PLATFORM', align: 'left', sortable: true },
    { id: 'codes', label: 'CODES', align: 'left', sortable: false },
    { 
      id: 'quantity', 
      label: 'QTY (A/T)', 
      align: 'center', 
      sortable: false,
      tooltip: 'Quantity: Active codes available / Total codes listed',
      style: { whiteSpace: 'nowrap' } // Ensure label stays on one line
    },
    { id: 'price', label: 'PRICE', align: 'left', sortable: true },
    { id: 'expiration', label: 'EXPIRATION', align: 'left', sortable: true },
    { id: 'status', label: 'STATUS', align: 'left', sortable: true },
    { id: 'created', label: 'CREATED', align: 'left', sortable: true },
    { id: 'actions', label: 'ACTIONS', align: 'right', sortable: false }
  ];

  const handleSort = (headerId: string) => {
    if (sortFieldMap[headerId]) {
      setSorting(sortFieldMap[headerId]);
    }
  };

  // Custom styling for specific columns
  const getColumnStyle = (headerId: string) => {
    if (headerId === 'quantity') {
      return { 
        width: '100px', 
        minWidth: '100px',
        whiteSpace: 'nowrap' // Prevent text wrapping
      }; 
    }
    return {};
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
          <TableCell 
            key={header.id} 
            align={header.align as any}
            style={getColumnStyle(header.id)}
          >
            {header.sortable ? (
              <Tooltip title={header.tooltip || ''} arrow placement="top">
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
              </Tooltip>
            ) : (
              <Tooltip title={header.tooltip || ''} arrow placement="top">
                <span style={header.style}>{header.label}</span>
              </Tooltip>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

export default ListingsTableHeader;