import { format } from "date-fns";
import { FormData } from "../../types";

interface PersonalDetailsSectionProps {
  formData: FormData;
}

const PersonalDetailsSection = ({ formData }: PersonalDetailsSectionProps) => {
  return (
    <div className="p-4">
      <h4 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-3">
        Basic Details
      </h4>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">Full name</dt>
          <dd className="text-sm font-medium text-dark mt-1">
            {formData.firstName} {formData.lastName}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">Email address</dt>
          <dd className="text-sm font-medium text-dark mt-1">{formData.email}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">Date of Birth</dt>
          <dd className="text-sm font-medium text-dark mt-1">
            {formData.dateOfBirth
              ? format(new Date(formData.dateOfBirth), "MMMM d, yyyy")
              : "Not provided"}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-gray-500">Nationality</dt>
          <dd className="text-sm font-medium text-dark mt-1">
            {formData.nationality || "Not provided"}
          </dd>
        </div>
      </dl>
    </div>
  );
};

export default PersonalDetailsSection; 