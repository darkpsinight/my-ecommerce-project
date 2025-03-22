import React, { useState } from 'react';
import Image from 'next/image';
import { FileUpload } from './FileUpload';

interface IDDocumentUploadsProps {
  formData: any;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemove: (fieldName: string) => void;
  analyzingField: string | null;
}

export const IDDocumentUploads: React.FC<IDDocumentUploadsProps> = ({ 
  formData, 
  onFileChange, 
  onRemove,
  analyzingField
}) => {
  const showBackSide = formData.idType !== 'passport';
  const isIdCard = formData.idType === 'driverLicense' || formData.idType === 'nationalId';
  
  const [showPassportGuide, setShowPassportGuide] = useState(false);
  const [showIdFrontGuide, setShowIdFrontGuide] = useState(false);
  const [showIdBackGuide, setShowIdBackGuide] = useState(false);

  return (
    <div className="space-y-4">
      <div className="relative">
        {formData.idType === 'passport' && (
          <button
            type="button"
            onClick={() => setShowPassportGuide(true)}
            className="absolute right-0 top-0 p-2 text-blue hover:text-blue-dark transition-colors"
            title="View passport guide"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}
        {isIdCard && (
          <button
            type="button"
            onClick={() => setShowIdFrontGuide(true)}
            className="absolute right-0 top-0 p-2 text-blue hover:text-blue-dark transition-colors"
            title="View ID front guide"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}
        <FileUpload
          id="idFront"
          name="idFront"
          label="ID Front Side"
          accept=".jpg,.jpeg,.png"
          onChange={onFileChange}
          files={formData.idFront}
          required
          maxSize="5MB"
          maxFiles={1}
          onRemove={() => onRemove('idFront')}
          isAnalyzing={analyzingField === 'idFront'}
        />
      </div>

      {showBackSide && (
        <div className="relative">
          {isIdCard && (
            <button
              type="button"
              onClick={() => setShowIdBackGuide(true)}
              className="absolute right-0 top-0 p-2 text-blue hover:text-blue-dark transition-colors"
              title="View ID back guide"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}
          <FileUpload
            id="idBack"
            name="idBack"
            label="ID Back Side"
            accept=".jpg,.jpeg,.png"
            onChange={onFileChange}
            files={formData.idBack}
            required
            maxSize="5MB"
            maxFiles={1}
            onRemove={() => onRemove('idBack')}
            isAnalyzing={analyzingField === 'idBack'}
          />
        </div>
      )}

      {/* Passport Guide Modal */}
      {showPassportGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-xl p-4 max-w-2xl w-full mx-4 border border-gray-100">
            <button
              type="button"
              onClick={() => setShowPassportGuide(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-xl font-semibold mb-4">KYC Passport Guide</h3>
            <div className="relative aspect-video w-full">
              <Image
                src="/images/kycGuide/KYC-Guide-Passport.webp"
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                alt="Passport Guide"
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* ID Front Guide Modal */}
      {showIdFrontGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-xl p-4 max-w-2xl w-full mx-4 border border-gray-100">
            <button
              type="button"
              onClick={() => setShowIdFrontGuide(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-xl font-semibold mb-4">KYC ID Front Guide</h3>
            <div className="relative aspect-video w-full">
              <Image
                src="/images/kycGuide/KYC-Guide-ID-Front.webp"
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                alt="ID Front Guide"
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* ID Back Guide Modal */}
      {showIdBackGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-xl p-4 max-w-2xl w-full mx-4 border border-gray-100">
            <button
              type="button"
              onClick={() => setShowIdBackGuide(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-xl font-semibold mb-4">KYC ID Back Guide</h3>
            <div className="relative aspect-video w-full">
              <Image
                src="/images/kycGuide/KYC-Guide-ID-Back.webp"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt="ID Back Guide"
                fill
                className="object-contain rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 