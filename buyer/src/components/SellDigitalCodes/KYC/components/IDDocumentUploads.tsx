import React from 'react';
import { FileUpload } from './FileUpload';

interface IDDocumentUploadsProps {
  formData: any;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemove: (fieldName: string) => void;
  analyzingField: string | null;
}

export const IDDocumentUploads: React.FC<IDDocumentUploadsProps> = ({ 
  formData, 
  onFileChange, 
  onRemove,
  analyzingField
}) => {
  return (
    <div className="space-y-4">
      <FileUpload
        id="idFront"
        name="idFront"
        label="ID Front Side"
        accept=".jpg,.jpeg,.png"
        onChange={onFileChange}
        files={formData.idFront}
        required
        maxSize="5MB"
        maxFiles={1}
        onRemove={() => onRemove('idFront')}
        isAnalyzing={analyzingField === 'idFront'}
      />

      <FileUpload
        id="idBack"
        name="idBack"
        label="ID Back Side"
        accept=".jpg,.jpeg,.png"
        onChange={onFileChange}
        files={formData.idBack}
        required
        maxSize="5MB"
        maxFiles={1}
        onRemove={() => onRemove('idBack')}
        isAnalyzing={analyzingField === 'idBack'}
      />
    </div>
  );
}; 