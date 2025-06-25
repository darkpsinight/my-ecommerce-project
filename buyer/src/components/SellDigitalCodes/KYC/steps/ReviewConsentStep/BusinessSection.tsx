import { FormData } from "../../types";

interface BusinessSectionProps {
  formData: FormData;
}

const BusinessSection = ({ formData }: BusinessSectionProps) => {
  if (!formData.isBusinessSeller) return null;
  
  return (
    <div className="p-4 bg-gray-50">
      <h4 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">
        Business Information
      </h4>
      <dl className="space-y-2">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">Business Tax ID</dt>
          <dd className="text-sm font-medium text-dark mt-1">
            {formData.businessTaxId || "Not provided"}
          </dd>
        </div>
      </dl>
    </div>
  );
};

export default BusinessSection; 