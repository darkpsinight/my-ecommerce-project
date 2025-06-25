import FilePreview from "../../components/FilePreview";
import { FormData } from "../../types";

interface IDVerificationSectionProps {
  formData: FormData;
}

const IDVerificationSection = ({ formData }: IDVerificationSectionProps) => {
  return (
    <div className="p-4">
      <h4 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">
        Identity Verification
      </h4>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">ID Type</dt>
          <dd className="text-sm font-medium text-dark mt-1">{formData.idType}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">ID Number</dt>
          <dd className="text-sm font-medium text-dark mt-1">{formData.idNumber}</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500 mb-2">ID Front Side</dt>
          <FilePreview files={formData.idFront} fileType="ID Front" />
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500 mb-2">ID Back Side</dt>
          <FilePreview files={formData.idBack} fileType="ID Back" />
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500 mb-2">Selfie Picture</dt>
          <FilePreview files={formData.selfie} fileType="Selfie" />
        </div>
      </div>
    </div>
  );
};

export default IDVerificationSection; 