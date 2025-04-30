import { FC } from 'react';
import {
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { CodeSearchProps } from './types';

export const CodeSearch: FC<CodeSearchProps> = ({ searchTerm, handleSearchChange }) => {
  return (
    <TextField
      fullWidth
      placeholder="Search codes..."
      value={searchTerm}
      onChange={handleSearchChange}
      sx={{ mb: 2 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default CodeSearch;
