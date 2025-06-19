import React, { useEffect } from "react";
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
    // closing modal while clicking outside
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest(".modal-content")) {
        closeModal();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeModal]);

  // Handle ESC key press
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

  // Copy code to clipboard
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

  return (
    <div
      className={`fixed top-0 left-0 overflow-y-auto no-scrollbar w-full h-screen sm:py-20 xl:py-25 2xl:py-[230px] bg-dark/70 sm:px-8 px-4 py-5 ${
        isOpen ? "block z-99999" : "hidden"
      }`}
    >
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[600px] rounded-xl shadow-3 bg-white p-7.5 relative modal-content">
          <button
            onClick={closeModal}
            aria-label="button for close modal"
            className="absolute top-0 right-0 sm:top-3 sm:right-3 flex items-center justify-center w-10 h-10 rounded-full ease-in duration-150 bg-meta text-body hover:text-dark"
          >
            <svg
              className="fill-current"
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.3108 13L19.2291 8.08167C19.5866 7.72417 19.5866 7.12833 19.2291 6.77083C19.0543 6.59895 18.8189 6.50262 18.5737 6.50262C18.3285 6.50262 18.0932 6.59895 17.9183 6.77083L13 11.6892L8.08164 6.77083C7.90679 6.59895 7.67142 6.50262 7.42623 6.50262C7.18104 6.50262 6.94566 6.59895 6.77081 6.77083C6.41331 7.12833 6.41331 7.72417 6.77081 8.08167L11.6891 13L6.77081 17.9183C6.41331 18.2758 6.41331 18.8717 6.77081 19.2292C7.12831 19.5867 7.72414 19.5867 8.08164 19.2292L13 14.3108L17.9183 19.2292C18.2758 19.5867 18.8716 19.5867 19.2291 19.2292C19.5866 18.8717 19.5866 18.2758 19.2291 17.9183L14.3108 13Z"
                fill=""
              />
            </svg>
          </button>

          <div>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-dark mb-2">Digital Code Details</h2>
              <div className="h-px bg-gray-3"></div>
            </div>

            {/* Product Information */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-dark mb-3">{code.productName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Platform:</span>
                    <span className="ml-2 font-medium">{code.platform}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Region:</span>
                    <span className="ml-2 font-medium">{code.region}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Purchase Date:</span>
                    <span className="ml-2 font-medium">{formatDate(code.purchaseDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expiration:</span>
                    {code.expirationDate ? (
                      <span className="ml-2 font-medium">{formatDate(code.expirationDate)}</span>
                    ) : (
                      <span className="ml-2 font-medium text-green-600">Never expires</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Order ID</div>
              <CopyableOrderId orderId={code.externalOrderId} />
            </div>

            {/* Activation Code */}
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-3">Your Activation Code</div>
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-dark mb-3 break-all select-all">
                    {code.code}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Click the code above to select it, or use the copy button below
                  </p>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-2 font-medium text-white bg-blue py-2.5 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Code
                  </button>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Important Information</h4>
                  <div className="mt-1 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Keep this code secure and don&apos;t share it with others</li>
                      <li>Use the code only on the specified platform and region</li>
                      {code.expirationDate && (
                        <li>Make sure to use the code before it expires</li>
                      )}
                      <li>Contact support if you have any issues with activation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;