import { FC } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { format } from 'date-fns';
import WarningAmberTwoToneIcon from '@mui/icons-material/WarningAmberTwoTone';

interface ExpirationDateCellProps {
  expirationDate?: string | Date | null;
}

const ExpirationDateCell: FC<ExpirationDateCellProps> = ({ expirationDate }) => {
  if (!expirationDate) {
    return (
      <Typography variant="body2" component="span">
        N/A
      </Typography>
    );
  }

  try {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        {diffDays >= 0 && diffDays <= 7 && (
          <Tooltip title={`Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`}>
            <WarningAmberTwoToneIcon
              sx={{ color: '#FFC107', mr: 0.5 }}
              fontSize="small"
            />
          </Tooltip>
        )}
        <Typography variant="body2" component="span">
          {format(expDate, 'yyyy-MM-dd')}
        </Typography>
      </Box>
    );
  } catch (error) {
    console.error('Invalid date format:', expirationDate);
    return (
      <Typography variant="body2" component="span" color="error">
        Invalid date
      </Typography>
    );
  }
};

export default ExpirationDateCell;
