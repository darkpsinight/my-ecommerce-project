"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepperUI from "./StepperUI";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import IdentityVerificationStep from "./steps/IdentityVerificationStep";
import LivenessCheckStep from "./steps/LivenessCheckStep";
import ReviewConsentStep from "./steps/ReviewConsentStep";
import SubmissionStep from "./steps/SubmissionStep";
import { FormData, steps } from "./types";

const SellerVerificationWizard = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: null,
    nationality: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    proofOfAddress: null,
    isBusinessSeller: false,
    businessTaxId: "",
    idType: "",
    idNumber: "",
    idFront: null,
    idBack: null,
    selfie: null,
    livenessVideo: null,
    termsConsent: false,
    dataConsent: false,
    accuracyConsent: false
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files) {
      const fileArray = Array.from(files);
      setFormData((prev) => ({ ...prev, [name]: fileArray }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: date,
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement API call to submit KYC data
      // const response = await fetch("/api/kyc", {
      //   method: "POST",
      //   body: JSON.stringify(formData),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      router.push("/sell-digital-codes/pending-verification");
    } catch (error) {
      console.error("Error submitting KYC:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const commonProps = {
      formData,
      handleInputChange,
      handleFileChange,
      handleDateChange,
    };

    switch (currentStep) {
      case 1:
        return <PersonalInfoStep {...commonProps} />;
      case 2:
        return <IdentityVerificationStep {...commonProps} />;
      case 3:
        return <LivenessCheckStep {...commonProps} />;
      case 4:
        return <ReviewConsentStep {...commonProps} />;
      case 5:
        return <SubmissionStep {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <StepperUI currentStep={currentStep} steps={steps} />

      <div className="mt-8">{renderStepContent()}</div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 border border-transparent rounded-md text-base font-medium text-white bg-blue hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.termsConsent ||
              !formData.dataConsent ||
              !formData.accuracyConsent
            }
            className="px-6 py-3 border border-transparent rounded-md text-base font-medium text-white bg-blue hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Verification"}
          </button>
        )}
      </div>
    </form>
  );
};

export default SellerVerificationWizard;
