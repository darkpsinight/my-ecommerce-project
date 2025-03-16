export interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  nationality: string;
  email: string;
  phoneNumber: string | undefined;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  proofOfAddress: File[] | null;
  isBusinessSeller: boolean;
  businessTaxId: string;

  // Identity Verification
  idType: string;
  idNumber: string;
  idFront: File[] | null;
  idBack: File[] | null;

  // Liveness Check
  selfie: File[] | null;
  livenessVideo: File[] | null;

  // Review & Consent
  termsConsent: boolean;
  dataConsent: boolean;
  accuracyConsent: boolean;

  [key: string]: any;
}

export interface StepProps {
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (date: Date | null) => void;
}

export interface CountryOption {
  label: string;
  value: string;
}

export const steps = [
  {
    title: "Personal Info",
    description: "Basic details",
  },
  {
    title: "Identity",
    description: "ID verification",
  },
  {
    title: "Liveness",
    description: "Proof of presence",
  },
  {
    title: "Review",
    description: "Check & consent",
  },
  {
    title: "Submit",
    description: "Final step",
  },
]; 