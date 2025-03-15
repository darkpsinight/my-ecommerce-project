import { StepProps } from "../types";

const ReviewConsentStep = ({ formData, handleInputChange }: StepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-dark">Review & Consent</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-dark">Personal Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Please review your information carefully.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-dark">Full name</dt>
              <dd className="mt-1 text-sm text-dark sm:mt-0 sm:col-span-2">
                {formData.firstName} {formData.lastName}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-dark">Email address</dt>
              <dd className="mt-1 text-sm text-dark sm:mt-0 sm:col-span-2">{formData.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-dark">Phone number</dt>
              <dd className="mt-1 text-sm text-dark sm:mt-0 sm:col-span-2">{formData.phoneNumber}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-dark">Address</dt>
              <dd className="mt-1 text-sm text-dark sm:mt-0 sm:col-span-2">
                {formData.address}, {formData.city}, {formData.country} {formData.postalCode}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-dark">ID Type</dt>
              <dd className="mt-1 text-sm text-dark sm:mt-0 sm:col-span-2">{formData.idType}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-dark">ID Number</dt>
              <dd className="mt-1 text-sm text-dark sm:mt-0 sm:col-span-2">{formData.idNumber}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              id="termsConsent"
              name="termsConsent"
              type="checkbox"
              required
              checked={formData.termsConsent}
              onChange={handleInputChange}
              className="focus:ring-blue h-4 w-4 text-blue border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="termsConsent" className="font-medium text-dark">
              Terms and Conditions
            </label>
            <p className="text-gray-500">
              I agree to the terms and conditions for selling digital codes on this platform.
            </p>
          </div>
        </div>

        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              id="dataConsent"
              name="dataConsent"
              type="checkbox"
              required
              checked={formData.dataConsent}
              onChange={handleInputChange}
              className="focus:ring-blue h-4 w-4 text-blue border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="dataConsent" className="font-medium text-dark">
              Data Processing Consent
            </label>
            <p className="text-gray-500">
              I consent to the processing of my personal data for verification purposes and understand
              that this information will be handled in accordance with the privacy policy.
            </p>
          </div>
        </div>

        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              id="accuracyConsent"
              name="accuracyConsent"
              type="checkbox"
              required
              checked={formData.accuracyConsent}
              onChange={handleInputChange}
              className="focus:ring-blue h-4 w-4 text-blue border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="accuracyConsent" className="font-medium text-dark">
              Information Accuracy
            </label>
            <p className="text-gray-500">
              I confirm that all the information provided is accurate and truthful to the best of my knowledge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewConsentStep; 