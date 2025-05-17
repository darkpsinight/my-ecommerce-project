import { FC, useState } from 'react';
import {
  Button,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography
} from '@mui/material';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import BlockTwoToneIcon from '@mui/icons-material/BlockTwoTone';
import DownloadTwoToneIcon from '@mui/icons-material/DownloadTwoTone';
import ArrowRightTwoToneIcon from '@mui/icons-material/ArrowRightTwoTone';
import FileDownloadTwoToneIcon from '@mui/icons-material/FileDownloadTwoTone';
import { BulkActionMenuItem } from '../types';

interface BulkActionsMenuProps {
  selected: string[];
  anchorEl: HTMLElement | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  onBulkAction: (action: string, subAction?: string) => void;
}

const BulkActionsMenu: FC<BulkActionsMenuProps> = ({
  selected,
  anchorEl,
  onMenuOpen,
  onMenuClose,
  onBulkAction
}) => {
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStatusMenuAnchorEl(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchorEl(null);
  };

  const handleStatusAction = (status: string) => {
    handleStatusMenuClose();
    onMenuClose();
    onBulkAction('status', status);
  };

  const bulkActions: BulkActionMenuItem[] = [
    {
      action: 'status',
      label: 'Change Status',
      icon: <CheckCircleTwoToneIcon fontSize="small" />,
      color: 'primary'
    },
    {
      action: 'export-csv',
      label: 'Download as CSV',
      icon: <FileDownloadTwoToneIcon fontSize="small" />,
      color: 'info'
    },
    {
      action: 'delete',
      label: 'Delete Selected',
      icon: <DeleteTwoToneIcon fontSize="small" />,
      color: 'error'
    }
  ];

  return (
    <>
      <Button
        sx={{ ml: 2 }}
        variant="outlined"
        disabled={selected.length === 0}
        onClick={onMenuOpen}
      >
        Bulk Actions
        {selected.length > 0 && (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              ml: 1,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.primary.contrastText,
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            {selected.length}
          </Box>
        )}
      </Button>

      {/* Main Bulk Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onMenuClose}>
        {bulkActions.map((action) => (
          <MenuItem
            key={action.action}
            onClick={
              action.action === 'status'
                ? handleStatusMenuOpen
                : () => onBulkAction(action.action)
            }
            disabled={selected.length === 0 || action.disabled}
            sx={{
              color: action.color
                ? (theme) => theme.palette[action.color].main
                : 'inherit'
            }}
          >
            <ListItemIcon
              sx={{
                color: action.color
                  ? (theme) => theme.palette[action.color].main
                  : 'inherit'
              }}
            >
              {action.icon}
            </ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
            {action.action === 'status' && (
              <ArrowRightTwoToneIcon fontSize="small" />
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* Status Submenu */}
      <Menu
        anchorEl={statusMenuAnchorEl}
        open={Boolean(statusMenuAnchorEl)}
        onClose={handleStatusMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <MenuItem onClick={() => handleStatusAction('active')}>
          <ListItemIcon sx={{ color: (theme) => theme.palette.success.main }}>
            <CheckCircleTwoToneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Set as On Sale</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusAction('draft')}>
          <ListItemIcon>
            <BlockTwoToneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Set as Draft</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default BulkActionsMenu;
