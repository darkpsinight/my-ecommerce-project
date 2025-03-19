import React from "react";
import { StepProps } from "../types";
import { IDTypeSelector } from "../components/IDTypeSelector";
import { IDNumberInput } from "../components/IDNumberInput";
import { IDDocumentUploads } from "../components/IDDocumentUploads";
import { useIdVerification } from "../hooks/useIdVerification";

/**
 * Identity Verification Step Component
 * 
 * This component handles the identity verification step in the KYC process.
 * It allows users to select their ID type, enter their ID number, and upload
 * front and back images of their ID document.
 */
const IdentityVerificationStep: React.FC<StepProps> = ({
  formData,
  handleInputChange,
  handleFileChange,
}) => {
  // Use our custom hook for ID verification logic
  const {
    idNumberError,
    idNumberPattern,
    handleSelectChange,
    handleIdNumberChange,
    handleFileUploadWithValidation,
    handleFileRemove,
    analyzingField
  } = useIdVerification({
    formData,
    handleInputChange,
    handleFileChange
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-dark">Identity Verification</h2>
        <p className="text-sm text-gray-500">Please provide your identification details for verification</p>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ID Type Selector Component */}
          <IDTypeSelector 
            value={formData.idType} 
            onChange={handleSelectChange} 
          />

          {/* ID Number Input Component */}
          <IDNumberInput
            value={formData.idNumber || ""}
            onChange={handleIdNumberChange}
            pattern={idNumberPattern}
            error={idNumberError}
          />
        </div>

        {/* ID Document Uploads Component */}
        <IDDocumentUploads 
          formData={formData}
          onFileChange={handleFileUploadWithValidation}
          onRemove={handleFileRemove}
          analyzingField={analyzingField}
        />
      </div>
    </div>
  );
};

export default IdentityVerificationStep;
