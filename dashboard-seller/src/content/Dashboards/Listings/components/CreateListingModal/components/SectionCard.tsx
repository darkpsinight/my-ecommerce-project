import { styled } from '@mui/material/styles';
import { Card } from '@mui/material';

/**
 * Styled card component for form sections
 */
const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  borderRadius: theme.shape.borderRadius,
  overflow: 'visible',
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.12)',
  },
}));

export default SectionCard;
