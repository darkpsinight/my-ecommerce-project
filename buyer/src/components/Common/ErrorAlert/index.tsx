import Link from 'next/link';
import React from 'react';

interface ErrorAlertProps {
  message: string;
  hint?: string;
  links?: {
    login?: string;
    passwordReset?: string;
  };
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, hint, links }) => {
  return (
    <div className="mb-4 p-4 rounded-lg border border-red-200" style={{ backgroundColor: '#FFEBE8' }}>
      <div className="flex items-center mb-2">
        <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="#EF4444">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="font-medium" style={{ color: '#EF4444' }}>{message}</span>
      </div>
      {hint && (
        <p className="text-sm ml-7">{hint}</p>
      )}
      {links && (
        <div className="mt-2 ml-7 text-sm">
          {links.login && (
            <Link href={links.login} className="text-blue hover:underline mr-4">
              Sign in instead
            </Link>
          )}
          {links.passwordReset && (
            <Link href={links.passwordReset} className="text-blue hover:underline">
              Reset password
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorAlert; 