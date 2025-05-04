import React from 'react';
import { 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Chip,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SellIcon from '@mui/icons-material/Sell';
import { format } from 'date-fns';
import { CodeItemProps } from '../utils/types';
import { CodeItem as StyledCodeItem } from './StyledComponents';

/**
 * Component for displaying a single product code
 */
const CodeItemComponent: React.FC<CodeItemProps> = ({ 
  code, 
  soldStatus, 
  soldAt, 
  onDelete 
}) => {
  const isSold = soldStatus === 'sold';
  
  return (
    <StyledCodeItem className={isSold ? 'sold' : ''}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="body1" 
              fontFamily="monospace" 
              fontWeight="500" 
              sx={{ 
                mr: 2,
                textDecoration: isSold ? 'line-through' : 'none',
                opacity: isSold ? 0.7 : 1
              }}
            >
              {code}
            </Typography>
            
            {isSold && (
              <Chip
                size="small"
                label={soldAt ? `Sold: ${format(new Date(soldAt), 'MMM d, yyyy')}` : 'Sold'}
                color="primary"
                variant="outlined"
                icon={<SellIcon fontSize="small" />}
                sx={{ height: 24 }}
              />
            )}
          </Box>
          
          <Tooltip title="Delete code">
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => onDelete(code)}
              sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </StyledCodeItem>
  );
};

export default CodeItemComponent;
