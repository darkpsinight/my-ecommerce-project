import React, { useRef } from 'react';
import { FormHelperText, Box, Typography, Chip } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FormData } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer, EditorContainer } from '../components/StyledComponents';
import LockIcon from '@mui/icons-material/Lock';

interface SellerNotesProps {
  formData: FormData;
  handleSellerNotesChange: (value: string) => void;
}

const SellerNotes: React.FC<SellerNotesProps> = ({
  formData,
  handleSellerNotesChange
}) => {
  const quillRef = useRef<ReactQuill>(null);

  return (
    <SectionContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <SectionHeader icon="notes" title="Seller Notes" />
        <Chip
          icon={<LockIcon fontSize="small" />}
          label="Private"
          size="small"
          color="default"
          variant="outlined"
          sx={{ fontWeight: 'medium' }}
        />
      </Box>
      <EditorContainer>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={formData.sellerNotes}
          onChange={handleSellerNotesChange}
          placeholder="Add any private notes about this listing..."
          modules={{
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link'],
              ['clean']
            ]
          }}
        />
        <FormHelperText sx={{ mt: 1, fontStyle: 'italic' }}>
          These notes are private and only visible to you. They will not be shared with buyers.
        </FormHelperText>
      </EditorContainer>
    </SectionContainer>
  );
};

export default SellerNotes;
