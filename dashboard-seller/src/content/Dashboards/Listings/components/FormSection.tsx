import { FC, ReactNode } from 'react';
import { Grid, Typography } from '@mui/material';

interface FormSectionProps {
  title: React.ReactNode;
  children: ReactNode;
  marginTop?: number;
}

/**
 * A reusable component for form sections with consistent styling
 */
export const FormSection: FC<FormSectionProps> = ({ 
  title, 
  children, 
  marginTop = 0 
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom sx={{ mt: marginTop }}>
          {title}
        </Typography>
      </Grid>
      {children}
    </>
  );
};