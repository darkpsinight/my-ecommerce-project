import { styled } from '@mui/material/styles';
import { Typography } from '@mui/material';

/**
 * Styled typography component for section titles
 */
const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
}));

export default SectionTitle;
