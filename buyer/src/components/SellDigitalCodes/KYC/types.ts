export interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;

  // Identity Verification
  idType: string;
  idNumber: string;
  idFront: File | null;
  idBack: File | null;

  // Liveness Check
  selfie: File | null;
  livenessVideo: File | null;

  // Review & Consent
  termsAccepted: boolean;
  dataProcessingAccepted: boolean;
}

export interface StepProps {
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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