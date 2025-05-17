import { styled } from '@mui/material/styles';
import { Card, Typography } from '@mui/material';

/**
 * Styled card component for form sections
 */
export const SectionCard = styled(Card)(({ theme }) => ({
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

/**
 * Styled typography component for section titles
 */
export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
}));

/**
 * Styled container for the rich text editor
 */
export const EditorContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  '& .ql-container': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '0 0 4px 4px',
    background: theme.palette.background.paper,
    minHeight: '150px',
    fontFamily: theme.typography.fontFamily,
    fontSize: '0.9rem',
  },
  '& .ql-toolbar': {
    background: theme.palette.grey[100],
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
    padding: '4px 8px',
    '& .ql-formats': {
      marginRight: '8px',
    },
    '& button': {
      height: '24px',
      width: '24px',
      padding: '2px',
    }
  },
  // Make the editor more compact
  '& .ql-editor': {
    padding: '8px 12px',
    lineHeight: 1.4,
  },
  // Error state styling
  '&.error .ql-container': {
    border: `1px solid ${theme.palette.error.main}`,
  },
  '&.error .ql-toolbar': {
    borderColor: theme.palette.error.main,
  },
  // Helper text styling
  '& .MuiFormHelperText-root': {
    marginLeft: '14px',
    marginTop: '4px',
    color: theme.palette.text.secondary,
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  // Placeholder styling
  '& .ql-editor.ql-blank::before': {
    color: theme.palette.text.secondary,
    fontStyle: 'normal',
    opacity: 0.7,
    fontSize: '0.9rem',
  }
}));
