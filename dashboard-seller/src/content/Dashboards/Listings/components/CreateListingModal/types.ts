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
  formErrors: ListingFormErrors;
  handleChange: (e: any) => void;
  handleBlur: (e: any) => void;
  handleSubmit: () => void;
  resetForm: () => void;
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
  code: string;
  expirationDate: string;
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
  code: string;
  thumbnailUrl: string;
}
