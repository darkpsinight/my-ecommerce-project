import { StepProps } from "../types";
import { ChangeEvent } from "react";

const IdentityVerificationStep = ({
  formData,
  handleInputChange,
  handleFileChange,
}: StepProps) => {
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-dark">
        Identity Verification
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="idType"
            className="block text-sm font-medium text-dark"
          >
            ID Type
          </label>
          <select
            id="idType"
            name="idType"
            required
            value={formData.idType}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue focus:ring-blue sm:text-sm"
          >
            <option value="">Select ID Type</option>
            <option value="passport">Passport</option>
            <option value="driverLicense">{"Driver's"} License</option>
            <option value="nationalId">National ID</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="idNumber"
            className="block text-sm font-medium text-dark"
          >
            ID Number
          </label>
          <input
            type="text"
            id="idNumber"
            name="idNumber"
            required
            value={formData.idNumber}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue focus:ring-blue sm:text-sm"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark">
            ID Front Side
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="idFront"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue hover:text-blue-dark focus-within:outline-none"
                >
                  <span>Upload front side</span>
                  <input
                    id="idFront"
                    name="idFront"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFileInput(e, "idFront")}
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark">
            ID Back Side
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="idBack"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue hover:text-blue-dark focus-within:outline-none"
                >
                  <span>Upload back side</span>
                  <input
                    id="idBack"
                    name="idBack"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFileInput(e, "idBack")}
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityVerificationStep;
