import { FC, useContext, useEffect, useState } from 'react';
import {
  TableRow,
  TableCell,
  Checkbox,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  useTheme,
  Chip
} from '@mui/material';
import { format } from 'date-fns';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';

import { Listing } from '../types';
import { CodeViewer } from './CodeViewer';
import ListingStatusBadge from './ListingStatusBadge';
import { ListingsContext } from '../context/ListingsContext';
import { keyframes } from '@emotion/react';

const flashAnimation = keyframes`
  0% {
    background-color: rgba(76, 175, 80, 0.3);
  }
  50% {
    background-color: rgba(76, 175, 80, 0.1);
  }
  100% {
    background-color: rgba(76, 175, 80, 0);
  }
`;

interface ListingRowProps {
  listing: Listing;
  isSelected: boolean;
  onSelectClick: (event: React.MouseEvent<unknown>, id: string) => void;
  onViewClick: (id: string) => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  anchorEl: HTMLElement | null;
  activeListingId: string | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onMenuClose: () => void;
}

const ListingRow: FC<ListingRowProps> = ({
  listing,
  isSelected,
  onSelectClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  anchorEl,
  activeListingId,
  onMenuOpen,
  onMenuClose
}) => {
  const theme = useTheme();
  const { newListingId } = useContext(ListingsContext);
  const [isFlashing, setIsFlashing] = useState(false);

  // Get quantity values from API or calculate as fallback
  const activeCodes = listing.quantityOfActiveCodes !== undefined ?
    listing.quantityOfActiveCodes :
    (listing.codes ? listing.codes.filter(code => code.soldStatus === 'active').length : 0);

  const totalCodes = listing.quantityOfAllCodes !== undefined ?
    listing.quantityOfAllCodes :
    (listing.codes ? listing.codes.length : 0);

  const isInactive = listing.status === 'sold' || listing.status === 'deleted' || activeCodes === 0;
  const isNewListing = newListingId === listing.externalId;

  useEffect(() => {
    if (isNewListing) {
      setIsFlashing(true);
    }
  }, [isNewListing]);

  const formatDate = (dateValue: Date | string | null): string => {
    if (!dateValue) return 'N/A';

    try {
      // Handle both string dates and Date objects
      const dateObj = typeof dateValue === 'string'
        ? new Date(dateValue)
        : dateValue;
      return format(dateObj, 'MM/dd/yyyy');
    } catch (error) {
      console.error('Invalid date format:', dateValue);
      return 'Invalid date';
    }
  };

  return (
    <TableRow
      hover
      key={listing.externalId}
      selected={isSelected}
      aria-checked={isSelected}
      tabIndex={-1}
      sx={
        isInactive
          ? {
              backgroundColor: (theme) => theme.palette.action.disabledBackground,
              color: (theme) => theme.palette.text.disabled,
              opacity: 0.7
            }
          : isFlashing
          ? {
              animation: `${flashAnimation} 2s ease-in-out 3`,
            }
          : {}
      }
    >
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={isSelected}
          onClick={(event) => onSelectClick(event, listing.externalId)}
          disabled={listing.status === 'deleted'}
          inputProps={{
            'aria-labelledby': `enhanced-table-checkbox-${listing.externalId}`
          }}
        />
      </TableCell>
      <TableCell>
        <Tooltip title={listing.title.length > 29 ? listing.title : ''} arrow placement="top">
          <Typography variant="body1" fontWeight="bold" noWrap>
            {listing.title.length > 29 ? `${listing.title.substring(0, 29)}...` : listing.title}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Typography variant="body1" noWrap>
          {listing.platform}
        </Typography>
      </TableCell>
      <TableCell>
        {listing.codes && listing.codes.length > 0 ? (
          <CodeViewer codes={listing.codes} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No codes available
          </Typography>
        )}
      </TableCell>
      <TableCell align="center">
        <Tooltip
          title="Number of codes that are currently on sale"
          arrow
          placement="top"
        >
          <Chip
            label={activeCodes}
            size="small"
            color={activeCodes > 0 ? 'success' : 'error'}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              minWidth: '30px',
              cursor: 'help'
            }}
          />
        </Tooltip>
      </TableCell>
      <TableCell align="center">
        <Tooltip
          title="Total number of codes for this listing"
          arrow
          placement="top"
        >
          <Chip
            label={totalCodes}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              minWidth: '30px',
              cursor: 'help'
            }}
          />
        </Tooltip>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          ${(listing.price || 0).toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell>
        <ListingStatusBadge status={listing.status} variant="chip" size="small" />
      </TableCell>
      <TableCell>
        <Typography variant="body1" noWrap>
          {formatDate(listing.createdAt)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Actions" arrow>
          <IconButton
            onClick={(e) => onMenuOpen(e, listing.externalId)}
            size="small"
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && activeListingId === listing.externalId}
          onClose={onMenuClose}
          keepMounted
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
        >
          <MenuItem onClick={() => onViewClick(listing.externalId)}>
            <VisibilityTwoToneIcon
              fontSize="small"
              sx={{ mr: 1, color: theme.palette.primary.main }}
            />
            View Details
          </MenuItem>

          <MenuItem
            onClick={() => onEditClick(listing.externalId)}
            disabled={listing.status === 'sold' || listing.status === 'expired' || listing.status === 'deleted'}
          >
            <EditTwoToneIcon
              fontSize="small"
              sx={{ mr: 1, color: theme.palette.success.main }}
            />
            Edit Listing
          </MenuItem>

          <MenuItem 
            onClick={() => onDeleteClick(listing.externalId)}
            disabled={listing.status === 'deleted'}
          >
            <DeleteTwoToneIcon
              fontSize="small"
              sx={{ mr: 1, color: theme.palette.error.main }}
            />
            {listing.status === 'deleted' ? 'Already Deleted' : 'Delete Listing'}
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
};

export default ListingRow;
