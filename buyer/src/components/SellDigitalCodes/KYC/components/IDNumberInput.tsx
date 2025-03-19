import React from 'react';

interface IDNumberInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pattern: string;
  error: string;
}

export const IDNumberInput: React.FC<IDNumberInputProps> = ({ 
  value, 
  onChange, 
  pattern, 
  error 
}) => {
  return (
    <div className="space-y-1">
      <label htmlFor="idNumber" className="text-sm font-medium text-dark">
        ID Number
      </label>
      <input
        id="idNumber"
        name="idNumber"
        type="text"
        value={value || ""}
        onChange={onChange}
        placeholder="Enter your ID number"
        pattern={pattern}
        className={`w-full px-4 py-2.5 rounded-lg border ${error ? 'border-red' : 'border-gray-300'} outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400`}
        required
      />
      {error && (
        <p className="text-sm text-red mt-1">{error}</p>
      )}
    </div>
  );
}; 