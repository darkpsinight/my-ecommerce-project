import { useRef, useState } from 'react';

import { NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'src/redux/hooks';
import { clearAuth } from 'src/redux/slices/authSlice';
import { resetProfileState } from 'src/redux/slices/sellerProfile';
import { authService } from 'src/services/api/auth';
import { clearAuthData } from 'src/utils/auth';
import { toast } from 'react-hot-toast';

import {
  Avatar,
  Box,
  Button,
  Divider,
  Hidden,
  lighten,
  List,
  ListItem,
  ListItemText,
  Popover,
  Typography
} from '@mui/material';

import InboxTwoToneIcon from '@mui/icons-material/InboxTwoTone';
import { styled } from '@mui/material/styles';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import AccountBoxTwoToneIcon from '@mui/icons-material/AccountBoxTwoTone';
import LockOpenTwoToneIcon from '@mui/icons-material/LockOpenTwoTone';
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';

const UserBoxButton = styled(Button)(
  ({ theme }) => `
        padding-left: ${theme.spacing(1)};
        padding-right: ${theme.spacing(1)};
`
);

const MenuUserBox = styled(Box)(
  ({ theme }) => `
        background: ${theme.colors.alpha.black[5]};
        padding: ${theme.spacing(2)};
`
);

const UserBoxText = styled(Box)(
  ({ theme }) => `
        text-align: left;
        padding-left: ${theme.spacing(1)};
`
);

const UserBoxLabel = styled(Typography)(
  ({ theme }) => `
        font-weight: ${theme.typography.fontWeightBold};
        color: ${theme.palette.secondary.main};
        display: block;
`
);

const UserBoxDescription = styled(Typography)(
  ({ theme }) => `
        color: ${lighten(theme.palette.secondary.main, 0.5)}
`
);

function HeaderUserbox() {
  const user = {
    name: 'Catherine Pike',
    avatar: '/static/images/avatars/1.jpg',
    jobtitle: 'Project Manager'
  };

  // Get seller profile data from Redux store
  const { profileData } = useAppSelector((state) => state.sellerProfile);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const ref = useRef<any>(null);
  const [isOpen, setOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleOpen = (): void => {
    setOpen(true);
  };

  const handleClose = (): void => {
    setOpen(false);
  };

  // Handle logout functionality
  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);

      // Call the logout API (this will include the auth token)
      await authService.logout();

      // Clear all auth data (Redux state and sessionStorage)
      clearAuthData();

      // Reset seller profile state
      dispatch(resetProfileState());

      // Close the dropdown
      setOpen(false);

      // Show success message
      toast.success('Successfully logged out');

      // Redirect to home page
      navigate('/');

    } catch (error) {
      console.error('Logout error:', error);

      // Even if the API call fails, we should still clear local data
      // This handles cases where the token might be expired or invalid
      clearAuthData();
      dispatch(resetProfileState());
      setOpen(false);

      // Show appropriate error message
      if (error instanceof Error && error.message.includes('No authentication token')) {
        toast.success('Logged out successfully');
        navigate('/');
      } else {
        toast.error('Logout completed, but there may have been an issue with the server.');
        navigate('/');
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Use seller profile nickname or fallback to user name
  const displayName = profileData?.nickname || user.name;
  const profileImageUrl = profileData?.profileImageUrl || user.avatar;

  return (
    <>
      <UserBoxButton color="secondary" ref={ref} onClick={handleOpen}>
        <Avatar variant="rounded" alt={displayName} src={profileImageUrl} />
        <Hidden mdDown>
          <UserBoxText>
            <UserBoxLabel variant="body1">{displayName}</UserBoxLabel>
            <UserBoxDescription variant="body2">
              {user.jobtitle}
            </UserBoxDescription>
          </UserBoxText>
        </Hidden>
        <Hidden smDown>
          <ExpandMoreTwoToneIcon sx={{ ml: 1 }} />
        </Hidden>
      </UserBoxButton>
      <Popover
        anchorEl={ref.current}
        onClose={handleClose}
        open={isOpen}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuUserBox sx={{ minWidth: 210 }} display="flex">
          <Avatar variant="rounded" alt={displayName} src={profileImageUrl} />
          <UserBoxText>
            <UserBoxLabel variant="body1">{displayName}</UserBoxLabel>
            <UserBoxDescription variant="body2">
              {user.jobtitle}
            </UserBoxDescription>
          </UserBoxText>
        </MenuUserBox>
        <Divider sx={{ mb: 0 }} />
        <List sx={{ p: 1 }} component="nav">
          <ListItem button to="/management/profile/details" component={NavLink}>
            <AccountBoxTwoToneIcon fontSize="small" />
            <ListItemText primary="My Profile" />
          </ListItem>
          <ListItem button to="/dashboards/messenger" component={NavLink}>
            <InboxTwoToneIcon fontSize="small" />
            <ListItemText primary="Messenger" />
          </ListItem>
          <ListItem
            button
            to="/management/profile/settings"
            component={NavLink}
          >
            <AccountTreeTwoToneIcon fontSize="small" />
            <ListItemText primary="Account Settings" />
          </ListItem>
        </List>
        <Divider />
        <Box sx={{ m: 1 }}>
          <Button
            color="primary"
            fullWidth
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LockOpenTwoToneIcon sx={{ mr: 1 }} />
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </Box>
      </Popover>
    </>
  );
}

export default HeaderUserbox;
