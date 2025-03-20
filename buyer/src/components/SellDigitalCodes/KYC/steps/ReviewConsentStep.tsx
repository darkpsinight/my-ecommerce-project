import { StepProps } from "../types";
import { useAnimatedDots } from "../hooks/useAnimatedDots";
import {
  StatusIndicator,
  ConsentItem,
  PersonalDetailsSection,
  AddressSection,
  BusinessSection,
  IDVerificationSection,
  StatusMessage
} from "./ReviewConsentStep/index";

/**
 * ReviewConsentStep - Component for reviewing user information and collecting consent
 * Now with better organization by splitting the component into smaller, focused parts
 */
const ReviewConsentStep = ({ formData, handleInputChange }: StepProps) => {
  // Generate summary status - check if all required checkboxes are checked
  const isAllConsentGiven =
    formData.termsConsent && formData.dataConsent && formData.accuracyConsent;

  // Use the animated dots hook
  const { getDots } = useAnimatedDots(!isAllConsentGiven);

  // Define consent items to render
  const consentItems = [
    {
      id: "termsConsent",
      label: "Terms and Conditions",
      description: "I agree to the terms and conditions for selling digital codes on this platform.",
      link: "#",
      linkText: "Read Terms",
      checked: formData.termsConsent,
    },
    {
      id: "dataConsent",
      label: "Data Processing Consent",
      description: "I consent to the processing of my personal data for verification purposes and understand that this information will be handled in accordance with the privacy policy.",
      link: "#",
      linkText: "Privacy Policy",
      checked: formData.dataConsent,
    },
    {
      id: "accuracyConsent",
      label: "Information Accuracy",
      description: "I confirm that all the information provided is accurate and truthful to the best of my knowledge.",
      checked: formData.accuracyConsent,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-dark mb-2">
            Review & Consent
          </h2>
          <div className="h-1 w-24 bg-blue rounded-full"></div>
        </div>
        <StatusIndicator isAllConsentGiven={isAllConsentGiven} />
      </div>

      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-white">
          <h3 className="text-lg font-semibold text-dark">
            Personal Information
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please verify that all your information is correct before
            proceeding.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          <PersonalDetailsSection formData={formData} />
          <AddressSection formData={formData} />
          <BusinessSection formData={formData} />
          <IDVerificationSection formData={formData} />
        </div>
      </div>

      {/* Consent Section */}
      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-dark mb-4">
          Consent Agreements
        </h3>

        <div className="space-y-5">
          {consentItems.map((item) => (
            <ConsentItem
              key={item.id}
              id={item.id}
              label={item.label}
              description={item.description}
              link={item.link}
              linkText={item.linkText}
              checked={item.checked}
              onChange={handleInputChange}
            />
          ))}
        </div>

        <StatusMessage 
          isAllConsentGiven={isAllConsentGiven}
        />
      </div>
    </div>
  );
};

export default ReviewConsentStep;
