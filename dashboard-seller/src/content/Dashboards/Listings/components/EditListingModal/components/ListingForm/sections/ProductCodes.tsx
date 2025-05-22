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
import PaginatedCodesTable from '../components/PaginatedCodesTable';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { validateCodeAgainstPattern, Pattern } from 'src/services/api/validation';

interface ProductCodesProps {
  formData: FormData;
  formErrors: FormErrors;
  handleTextChange: (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => void;
  handleDateChange: (date: Date | null) => void;
  handleAddCode: () => void;
  handleDeleteCode: (codeToDelete: string) => void;
  handleCodeKeyDown: (e: React.KeyboardEvent) => void;
  selectedPattern?: Pattern | null;
  listingId?: string;
  onRefresh?: () => void;
}

const ProductCodes: React.FC<ProductCodesProps> = ({
  formData,
  formErrors,
  handleTextChange,
  handleDateChange,
  handleAddCode,
  handleDeleteCode,
  handleCodeKeyDown,
  selectedPattern,
  listingId,
  onRefresh
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
            required
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
              value={formData.newExpirationDate}
              onChange={handleDateChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  variant="outlined"
                  helperText="Leave blank if the code doesn't expire"
                  placeholder=""
                />
              )}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />

          {formErrors.codes && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.codes}
            </Alert>
          )}

          {/* Display added codes using the paginated table */}
          <PaginatedCodesTable
            codes={formData.codes || []}
            onDeleteCode={handleDeleteCode}
            listingId={listingId || ''}
            listingStatus={formData.status}
            onCodeDeleted={onRefresh}
          />

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
