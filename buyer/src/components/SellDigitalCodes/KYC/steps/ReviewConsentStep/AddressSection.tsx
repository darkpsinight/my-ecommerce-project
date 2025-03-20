import FilePreview from "../../components/FilePreview";
import { FormData } from "../types";

interface AddressSectionProps {
  formData: FormData;
}

const AddressSection = ({ formData }: AddressSectionProps) => {
  return (
    <div className="p-4">
      <h4 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">
        Address Information
      </h4>
      <dl className="space-y-2">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">Complete Address</dt>
          <dd className="text-sm font-medium text-dark mt-1">
            {formData.address}, {formData.city}, {formData.country}{" "}
            {formData.postalCode}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">Proof of Address</dt>
          <dd className="mt-2">
            <FilePreview
              files={formData.proofOfAddress}
              fileType="Proof of Address"
            />
          </dd>
        </div>
      </dl>
    </div>
  );
};

export default AddressSection; 