import { FC } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export const showSuccessToast = (message: string) => {
  toast.success(message || 'Operation completed successfully!', { duration: 5000 });
};

export const showErrorToast = (message: string) => {
  toast.error(message || 'An error occurred. Please try again.', { duration: 5000 });
};

const ToastContainer: FC = () => {
  return <Toaster position="top-right" />;
};

export default ToastContainer;
