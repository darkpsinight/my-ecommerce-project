import { Pattern } from 'src/services/api/validation';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  platforms?: Array<{
    name: string;
    description?: string;
    isActive?: boolean;
    patterns?: Array<{
      regex: string;
      description: string;
      example: string;
    }>;
  }>;
  isActive?: boolean;
}

export interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (response: any) => void;
  initialCategories?: Category[];
}

// Define a custom type for the multi-field update
export type MultiFieldUpdate = {
  fields: Record<string, any>;
};

export interface ModalContextProps {
  categories: Category[];
  availablePlatforms: string[];
  selectedCategory: Category | null;
  patterns: Pattern[];
  selectedPattern: Pattern | null;
  patternLoading: boolean;
  validationError: string | null;
  regions: string[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  formData: ListingFormData;
  setFormData: React.Dispatch<React.SetStateAction<ListingFormData>>;
  formErrors: ListingFormErrors;
  handleChange: (e: React.ChangeEvent<HTMLInputElement> | MultiFieldUpdate) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  handleDateChange: (date: Date | null) => void;
  handleAddCode: () => void;
  handleDeleteCode: (code: string) => void;
  handleCodeKeyDown: (e: React.KeyboardEvent) => void;
  resetForm: () => void;
  // New image-related properties
  temporaryImageFile: File | null;
  handleImageFileSelect: (file: File | null) => void;
  imageUploadInProgress: boolean;
  // URL-related properties
  imageUrl: string;
  handleImageUrlChange: (url: string) => void;
  // Expose setSubmitting for better control of loading states
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CodeItem {
  code: string;
  expirationDate: string | Date | null;
  isInvalid?: boolean;
  invalidReason?: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  platform: string;
  region: string;
  isRegionLocked: boolean;
  codes: CodeItem[];
  newCode: string;
  newExpirationDate: string | Date | null;
  supportedLanguages: string[];
  thumbnailUrl: string;
  autoDelivery: boolean;
  tags: string[];
  sellerNotes: string;
  status: string;
}

export interface ListingFormErrors {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  platform: string;
  region: string;
  newCode: string;
  codes: string;
  thumbnailUrl: string;
}
