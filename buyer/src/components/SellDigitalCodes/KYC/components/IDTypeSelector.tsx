import React from 'react';

interface IDTypeSelectorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const IDTypeSelector: React.FC<IDTypeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-1">
      <label htmlFor="idType" className="text-sm font-medium text-dark">
        ID Type <span className="text-red">*</span>
      </label>
      <select
        id="idType"
        name="idType"
        required
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all"
      >
        <option value="">Select ID Type</option>
        <option value="passport">Passport</option>
        <option value="driverLicense">{"Driver's"} License</option>
        <option value="nationalId">National ID</option>
      </select>
    </div>
  );
}; 