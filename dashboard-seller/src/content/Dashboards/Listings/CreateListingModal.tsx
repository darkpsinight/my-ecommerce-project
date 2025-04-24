import { FC } from 'react';
import { CreateListingModal as ModalComponent } from './components/CreateListingModal';

// Re-export types that might be used elsewhere in the codebase
export interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (response: any) => void;
}

/**
 * CreateListingModal
 * 
 * This component has been refactored to use a modular approach.
 * The implementation details have been moved to:
 * - ./components/CreateListingModal/ModalContainer.tsx (UI structure)
 * - ./components/CreateListingModal/ModalContext.tsx (state management)
 * - ./components/CreateListingModal/types.ts (type definitions)
 * 
 * This wrapper maintains the same API for backward compatibility.
 */
const CreateListingModal: FC<CreateListingModalProps> = (props) => {
  return <ModalComponent {...props} />;
};

export default CreateListingModal;
