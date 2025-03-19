import React from 'react';
import Select from 'react-select';
import { FormField } from './FormField';
import { FormData } from '../types';

interface AddressFieldsProps {
  formData: FormData;
  handleAddressInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCountrySelect: (selectedOption: any, action: { name: string }) => void;
  countries: { label: string; value: string }[];
  cityError: string;
  postalCodeError: string;
  styles: { [key: string]: string };
}

export const AddressFields: React.FC<AddressFieldsProps> = ({
  formData,
  handleAddressInput,
  handleCountrySelect,
  countries,
  cityError,
  postalCodeError,
  styles,
}) => {
  return (
    <div className="space-y-4">
      <FormField
        label="Street Address"
        id="address"
        name="address"
        value={formData.address}
        onChange={handleAddressInput}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label htmlFor="country" className="text-sm font-medium text-dark">
            Country <span className="text-red">*</span>
          </label>
          <Select
            id="country"
            name="country"
            options={countries}
            value={countries.find(country => country.label === formData.country)}
            onChange={(option) => handleCountrySelect(option, { name: "country" })}
            className={styles.select}
            classNamePrefix="react-select"
            placeholder="Select country"
            required
          />
        </div>
        <FormField
          label="City"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleAddressInput}
          required
          error={cityError}
        />
        <div className="space-y-1">
          <label htmlFor="postalCode" className="text-sm font-medium text-dark">
            Postal Code <span className="text-red">*</span>
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            required
            value={formData.postalCode}
            onChange={handleAddressInput}
            className={`w-full px-4 py-2.5 rounded-lg border ${postalCodeError ? 'border-red' : 'border-gray-300'} outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400`}
          />
          {postalCodeError && (
            <p className="text-sm text-red mt-1">{postalCodeError}</p>
          )}
        </div>
      </div>
    </div>
  );
}; 