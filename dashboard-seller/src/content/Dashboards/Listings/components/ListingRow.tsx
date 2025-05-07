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
  useTheme
} from '@mui/material';
import { format } from 'date-fns';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityTwoToneIcon from '@mui/icons-material/VisibilityTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';

import { Listing } from '../types';
import { CodeViewer } from './CodeViewer';
import ListingStatusBadge from './ListingStatusBadge';
import ExpirationDateCell from './ExpirationDateCell';
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

  const isInactive = listing.status === 'sold' || activeCodes === 0;
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
          title="Format: Active/Total (Active codes available / Total codes listed)"
          arrow
          placement="top"
        >
          <Typography
            variant="body1"
            fontWeight="bold"
            color={activeCodes > 0 ? 'success.main' : 'error.main'}
            sx={{ cursor: 'help' }}
          >
            {activeCodes}/{totalCodes}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          ${(listing.price || 0).toFixed(2)}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <ExpirationDateCell expirationDate={listing.expirationDate} />
      </TableCell>
      <TableCell>
        <ListingStatusBadge status={listing.status} />
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
            disabled={listing.status === 'sold' || listing.status === 'expired'}
          >
            <EditTwoToneIcon
              fontSize="small"
              sx={{ mr: 1, color: theme.palette.success.main }}
            />
            Edit Listing
          </MenuItem>

          <MenuItem onClick={() => onDeleteClick(listing.externalId)}>
            <DeleteTwoToneIcon
              fontSize="small"
              sx={{ mr: 1, color: theme.palette.error.main }}
            />
            Delete Listing
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
};

export default ListingRow;
