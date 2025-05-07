import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ErrorContextType {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType>({
  error: null,
  setError: () => {},
  clearError: () => {}
});

export const useError = () => useContext(ErrorContext);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  return (
    <ErrorContext.Provider
      value={{
        error,
        setError,
        clearError
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};
