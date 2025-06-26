import React, { useEffect } from "react";
import Link from "next/link";
import { PurchasedCode } from "@/services/orders";
import { formatDate, copyToClipboard as copyToClipboardUtil } from "@/utils/codeUtils";
import { toast } from "react-hot-toast";
import CopyableOrderId from "@/components/Common/CopyableOrderId";

interface CodeModalProps {
  isOpen: boolean;
  closeModal: () => void;
  code: PurchasedCode | null;
}

const CodeModal: React.FC<CodeModalProps> = ({ isOpen, closeModal, code }) => {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest(".modal-content")) {
        closeModal();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeModal]);

  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, closeModal]);

  const copyToClipboard = async () => {
    if (!code) return;
    
    try {
      const success = await copyToClipboardUtil(code.code, "Code copied to clipboard!");
      if (success) {
        toast.success("Code copied to clipboard!");
      } else {
        toast.error("Failed to copy code");
      }
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code");
    }
  };

  if (!code) return null;

  const isExpired = code.expirationDate && new Date(code.expirationDate) < new Date();
  const isExpiring = code.expirationDate && 
    new Date(code.expirationDate) > new Date() &&
    new Date(code.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div
      className={`fixed top-0 left-0 overflow-y-auto no-scrollbar w-full h-screen sm:py-20 xl:py-25 2xl:py-[230px] bg-dark/70 backdrop-blur-sm sm:px-8 px-4 py-5 ${
        isOpen ? "block z-99999" : "hidden"
      }`}
    >
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[700px] rounded-2xl shadow-3 bg-white relative modal-content overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal to-blue p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <button
                onClick={closeModal}
                aria-label="Close modal"
                className="absolute top-0 right-0 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="flex items-start gap-4 pr-12">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{code.productName}</h2>
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      {code.platform}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {code.region}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {isExpired && (
                <div className="absolute top-4 right-16 bg-red text-white text-xs px-3 py-1 rounded-full font-medium">
                  Expired
                </div>
              )}
              {isExpiring && (
                <div className="absolute top-4 right-16 bg-yellow text-yellow-dark text-xs px-3 py-1 rounded-full font-medium">
                  Expiring Soon
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            
            {/* Purchase Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-br from-gray-1 to-gray-2/50 rounded-xl p-4">
                <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Purchase Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-6">Order ID:</span>
                    <CopyableOrderId orderId={code.externalOrderId} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-6">Purchase Date:</span>
                    <span className="font-medium">{formatDate(code.purchaseDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-6">Expiration:</span>
                    {code.expirationDate ? (
                      <span className={`font-medium ${isExpired ? 'text-red' : isExpiring ? 'text-yellow-dark' : ''}`}>
                        {formatDate(code.expirationDate)}
                      </span>
                    ) : (
                      <span className="font-medium text-green">Never expires</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal/10 to-blue/10 rounded-xl p-4">
                <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-4-4 4-4 .257.257A6 6 0 0118 8zm-6-2a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 text-sm text-teal hover:text-teal-dark transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    View Full Order History
                  </Link>
                  <Link
                    href="/products"
                    className="flex items-center gap-2 text-sm text-blue hover:text-blue-dark transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Browse More Products
                  </Link>
                </div>
              </div>
            </div>

            {/* Activation Code */}
            <div className="mb-6">
              <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-4-4 4-4 .257.257A6 6 0 0118 8zm-6-2a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                </svg>
                Your Activation Code
              </h3>
              <div className="bg-gradient-to-br from-green/5 to-teal/5 border-2 border-dashed border-green/20 rounded-xl p-6">
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-3">
                    <div className="font-mono text-2xl font-bold text-dark mb-2 break-all select-all tracking-wider">
                      {code.code}
                    </div>
                    <p className="text-xs text-gray-5">
                      Click the code above to select it, or use the copy button below
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-2 font-medium text-white bg-gradient-to-r from-green to-teal py-3 px-8 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5a2 2 0 00-2-2v8z" />
                    </svg>
                    Copy Code to Clipboard
                  </button>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-gradient-to-br from-yellow/10 to-orange/10 border border-yellow/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow to-orange flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-dark mb-2">Important Usage Guidelines</h4>
                  <ul className="text-sm text-gray-7 space-y-1 list-disc list-inside">
                    <li>Keep this code secure and don&apos;t share it with others</li>
                    <li>Use the code only on the specified platform ({code.platform}) and region ({code.region})</li>
                    {code.expirationDate && (
                      <li className={isExpired ? 'text-red' : isExpiring ? 'text-yellow-dark' : ''}>
                        {isExpired ? 'This code has expired' : 'Make sure to use the code before it expires'}
                      </li>
                    )}
                    <li>Contact our support team if you have any issues with activation</li>
                    <li>Save this information for your records</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-3">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Close
              </button>
              <Link
                href="/orders"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal to-blue text-white rounded-xl font-medium text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                View Order Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;