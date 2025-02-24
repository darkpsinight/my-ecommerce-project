import React from 'react';

interface SuccessAlertProps {
  message: string;
  subMessage?: string;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, subMessage }) => {
  return (
    <div className="mb-4 p-4 rounded-lg border border-green-200 bg-green-50">
      <div className="flex items-center mb-2">
        <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="#10B981">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-medium text-green-600">{message}</span>
      </div>
      {subMessage && (
        <p className="text-sm ml-7 text-green-600">{subMessage}</p>
      )}
    </div>
  );
};

export default SuccessAlert; 