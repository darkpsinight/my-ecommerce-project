import React, { useRef } from 'react';
import { FormHelperText } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FormData } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer, EditorContainer } from '../components/StyledComponents';

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
      <SectionHeader icon="notes" title="Seller Notes" />
      <EditorContainer>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={formData.sellerNotes}
          onChange={handleSellerNotesChange}
          placeholder="Add any additional notes or instructions for buyers..."
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
        <FormHelperText>
          These notes will be visible to buyers after purchase
        </FormHelperText>
      </EditorContainer>
    </SectionContainer>
  );
};

export default SellerNotes;
