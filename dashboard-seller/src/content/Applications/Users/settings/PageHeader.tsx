import { Typography } from '@mui/material';
import { useAppSelector } from 'src/redux/hooks';

function PageHeader() {
  const user = {
    name: 'Catherine Pike',
    avatar: '/static/images/avatars/1.jpg'
  };

  // Get seller profile data from Redux store
  const { profileData } = useAppSelector((state) => state.sellerProfile);
  const displayName = profileData?.nickname || user.name;

  return (
    <>
      <Typography variant="h3" component="h3" gutterBottom>
        User Settings
      </Typography>
      <Typography variant="subtitle2">
        {displayName}, this could be your user settings panel.
      </Typography>
    </>
  );
}

export default PageHeader;
