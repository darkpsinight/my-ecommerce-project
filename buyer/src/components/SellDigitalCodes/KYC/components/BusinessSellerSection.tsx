import React from 'react';
import { FormField } from './FormField';
import { FileUpload } from './FileUpload';
import { FormData } from '../types';

interface BusinessSellerSectionProps {
  formData: FormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BusinessSellerSection: React.FC<BusinessSellerSectionProps> = ({
  formData,
  handleInputChange,
  handleFileChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isBusinessSeller"
          name="isBusinessSeller"
          checked={formData.isBusinessSeller}
          onChange={handleInputChange}
          className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
        />
        <label htmlFor="isBusinessSeller" className="text-sm font-medium text-dark">
          I am a business seller
        </label>
      </div>

      {formData.isBusinessSeller && (
        <>
          <FormField
            label="Business Tax ID (EIN, VAT, GST)"
            id="businessTaxId"
            name="businessTaxId"
            value={formData.businessTaxId}
            onChange={handleInputChange}
            placeholder="Enter your business tax ID"
            required
          />

          <FileUpload
            id="proofOfAddress"
            name="proofOfAddress"
            label="Proof of Address (PDF/JPEG)"
            accept=".pdf,.jpg,.jpeg"
            onChange={handleFileChange}
            files={formData.proofOfAddress}
            required={formData.isBusinessSeller}
          />
        </>
      )}
    </div>
  );
}; 