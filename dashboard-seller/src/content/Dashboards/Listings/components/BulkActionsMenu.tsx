import { FC } from 'react';
import {
  Button,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import PauseCircleTwoToneIcon from '@mui/icons-material/PauseCircleTwoTone';
import DownloadTwoToneIcon from '@mui/icons-material/DownloadTwoTone';
import { BulkActionMenuItem } from '../types';

interface BulkActionsMenuProps {
  selected: string[];
  anchorEl: HTMLElement | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  onBulkAction: (action: string) => void;
}

const BulkActionsMenu: FC<BulkActionsMenuProps> = ({
  selected,
  anchorEl,
  onMenuOpen,
  onMenuClose,
  onBulkAction
}) => {
  const bulkActions: BulkActionMenuItem[] = [
    {
      action: 'delete',
      label: 'Delete Selected',
      icon: <DeleteTwoToneIcon fontSize="small" />
    },
    {
      action: 'pause',
      label: 'Pause Selected',
      icon: <PauseCircleTwoToneIcon fontSize="small" />
    },
    {
      action: 'export',
      label: 'Export Selected to CSV',
      icon: <DownloadTwoToneIcon fontSize="small" />
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
              backgroundColor: theme => theme.palette.primary.main,
              color: theme => theme.palette.primary.contrastText,
              fontWeight: 'bold',
              fontSize: 14
            }}
          >
            {selected.length}
          </Box>
        )}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onMenuClose}
      >
        {bulkActions.map((action) => (
          <MenuItem
            key={action.action}
            onClick={() => onBulkAction(action.action)}
            disabled={selected.length === 0 || action.disabled}
          >
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default BulkActionsMenu;
