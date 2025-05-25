import {
  Avatar,
  Tooltip,
  IconButton,
  Box,
  Button,
  styled,
  InputBase,
  useTheme
} from '@mui/material';
import { useThemeContext } from 'src/contexts/ThemeContext';
import { useAppSelector } from 'src/redux/hooks';
import AttachFileTwoToneIcon from '@mui/icons-material/AttachFileTwoTone';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';

const MessageInputWrapper = styled(InputBase)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(18)};
    padding: ${theme.spacing(1)};
    width: 100%;
    color: ${theme.palette.mode === 'dark'
      ? theme.colors.alpha.white[100]
      : theme.colors.alpha.black[100]};
`
);

const Input = styled('input')({
  display: 'none'
});

function BottomBarContent() {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();

  const user = {
    name: 'Catherine Pike',
    avatar: '/static/images/avatars/1.jpg'
  };

  // Get seller profile data from Redux store
  const { profileData } = useAppSelector((state) => state.sellerProfile);
  const displayName = profileData?.nickname || user.name;
  const profileImageUrl = profileData?.profileImageUrl || user.avatar;

  return (
    <Box
      sx={{
        background: isDarkMode
          ? theme.colors.alpha.black[10]
          : theme.colors.alpha.white[50],
        display: 'flex',
        alignItems: 'center',
        p: 2
      }}
    >
      <Box flexGrow={1} display="flex" alignItems="center">
        <Avatar
          sx={{ display: { xs: 'none', sm: 'flex' }, mr: 1 }}
          alt={displayName}
          src={profileImageUrl}
        />
        <MessageInputWrapper
          autoFocus
          placeholder="Write your message here..."
          fullWidth
        />
      </Box>
      <Box>
        <Tooltip arrow placement="top" title="Choose an emoji">
          <IconButton
            sx={{ fontSize: theme.typography.pxToRem(16) }}
            color="primary"
          >
            😀
          </IconButton>
        </Tooltip>
        <Input accept="image/*" id="messenger-upload-file" type="file" />
        <Tooltip arrow placement="top" title="Attach a file">
          <label htmlFor="messenger-upload-file">
            <IconButton sx={{ mx: 1 }} color="primary" component="span">
              <AttachFileTwoToneIcon fontSize="small" />
            </IconButton>
          </label>
        </Tooltip>
        <Button startIcon={<SendTwoToneIcon />} variant="contained">
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default BottomBarContent;
