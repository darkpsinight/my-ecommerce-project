import React, { useRef } from 'react';
import { FormHelperText } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FormData, FormErrors } from '../utils/types';
import SectionHeader from '../components/SectionHeader';
import { SectionContainer, EditorContainer } from '../components/StyledComponents';

interface DescriptionProps {
  formData: FormData;
  formErrors: FormErrors;
  handleDescriptionChange: (value: string) => void;
}

const Description: React.FC<DescriptionProps> = ({
  formData,
  formErrors,
  handleDescriptionChange
}) => {
  const quillRef = useRef<ReactQuill>(null);

  // Quill modules configuration with image upload support
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'], 
      ['clean']
    ]
  };

  return (
    <SectionContainer>
      <SectionHeader icon="description" title="Description" />
      <EditorContainer className={formErrors.description ? 'error' : ''}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={formData.description}
          onChange={handleDescriptionChange}
          placeholder="Provide a detailed description of your product..."
          modules={modules}
        />
        {formErrors.description && (
          <FormHelperText error>{formErrors.description}</FormHelperText>
        )}
      </EditorContainer>
    </SectionContainer>
  );
};

export default Description;
