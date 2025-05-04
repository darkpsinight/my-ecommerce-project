import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CodeIcon from '@mui/icons-material/Code';
import { FormData, FormErrors } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer, AddButton } from '../components/StyledComponents';
import CodeItemComponent from '../components/CodeItem';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

interface ProductCodesProps {
  formData: FormData;
  formErrors: FormErrors;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  handleDateChange: (date: Date | null) => void;
  handleAddCode: () => void;
  handleDeleteCode: (codeToDelete: string) => void;
  handleCodeKeyDown: (e: React.KeyboardEvent) => void;
}

const ProductCodes: React.FC<ProductCodesProps> = ({
  formData,
  formErrors,
  handleTextChange,
  handleDateChange,
  handleAddCode,
  handleDeleteCode,
  handleCodeKeyDown
}) => {
  const codesCount = formData.codes?.length || 0;

  return (
    <SectionContainer>
      <SectionHeader icon="code" title="Product Codes" />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Add Product Code"
            name="newCode"
            value={formData.newCode}
            onChange={handleTextChange}
            error={!!formErrors.newCode}
            helperText={formErrors.newCode || 'Enter a valid product code'}
            variant="outlined"
            placeholder="Enter code and press Enter or Add button"
            onKeyDown={handleCodeKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CodeIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    color="primary" 
                    onClick={handleAddCode}
                    disabled={!formData.newCode.trim()}
                  >
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Expiration Date (Optional)"
              value={formData.expirationDate}
              onChange={handleDateChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  helperText="Set if codes have an expiration date"
                />
              )}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="500">
              Product Codes ({codesCount})
            </Typography>
            
            {codesCount > 0 && (
              <Typography variant="body2" color="text.secondary">
                {codesCount} code{codesCount !== 1 ? 's' : ''} added
              </Typography>
            )}
          </Box>

          {formErrors.codes && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.codes}
            </Alert>
          )}

          {codesCount === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No codes added yet. Add at least one product code.
            </Alert>
          ) : (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {formData.codes?.map((codeItem) => (
                <CodeItemComponent
                  key={codeItem.code}
                  code={codeItem.code}
                  soldStatus={codeItem.soldStatus}
                  soldAt={codeItem.soldAt}
                  onDelete={handleDeleteCode}
                />
              ))}
            </Stack>
          )}

          <AddButton
            startIcon={<AddIcon />}
            onClick={() => {
              document.getElementsByName('newCode')[0]?.focus();
            }}
            fullWidth
            sx={{ mt: 2 }}
          >
            Add Another Code
          </AddButton>
        </Grid>
      </Grid>
    </SectionContainer>
  );
};

export default ProductCodes;
