import { FC } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import LargerDismissibleToast from 'src/components/LargerDismissibleToast';

export const showSuccessToast = (message: string) => {
  toast.custom(
    (t) => (
      <LargerDismissibleToast
        t={t}
        message={message || 'Operation completed successfully!'}
        type="success"
      />
    ),
    { duration: 10000 }
  );
};

export const showErrorToast = (message: string) => {
  toast.custom(
    (t) => (
      <LargerDismissibleToast
        t={t}
        message={message || 'An error occurred. Please try again.'}
        type="error"
      />
    ),
    { duration: 10000 }
  );
};

const ToastContainer: FC = () => {
  return <Toaster position="top-right" />;
};

export default ToastContainer;
