import { styled } from '@mui/material/styles';
import { Button, Card, Paper } from '@mui/material';

// Styled container for the Quill editor with improved styling
export const EditorContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  '& .ql-container': {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '0 0 8px 8px',
    background: theme.palette.background.paper,
    minHeight: '200px',
    fontFamily: theme.typography.fontFamily,
    fontSize: '1rem'
  },
  '& .ql-toolbar': {
    background: theme.palette.grey[50],
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderRadius: `8px 8px 0 0`,
    padding: '8px'
  },
  '& .ql-editor': {
    minHeight: '200px',
    padding: '16px'
  },
  // Error state styling
  '&.error .ql-container': {
    border: `1px solid ${theme.palette.error.main}`
  },
  '&.error .ql-toolbar': {
    borderColor: theme.palette.error.main
  },
  // Helper text styling
  '& .MuiFormHelperText-root': {
    marginLeft: '14px',
    marginTop: '4px',
    color: theme.palette.text.secondary,
    '&.Mui-error': {
      color: theme.palette.error.main
    }
  },
  // Placeholder styling
  '& .ql-editor.ql-blank::before': {
    color: theme.palette.text.secondary,
    fontStyle: 'normal',
    opacity: 0.7,
    padding: '0 16px'
  }
}));

// Improved code item styling
export const CodeItem = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  transition: 'all 0.2s ease',
  '&.sold': {
    opacity: 0.7,
    backgroundColor: theme.palette.action.disabledBackground
  },
  '& .MuiCardContent-root': {
    padding: theme.spacing(1.5),
    '&:last-child': {
      paddingBottom: theme.spacing(1.5)
    }
  }
}));

// Section container with consistent styling
export const SectionContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.primary.main,
    opacity: 0.7
  }
}));

// Custom styled button for adding items
export const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.primary.main,
  border: `1px dashed ${theme.palette.primary.main}`,
  '&:hover': {
    backgroundColor: theme.palette.grey[100]
  }
}));
