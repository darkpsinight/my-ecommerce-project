import Image from "next/image";
import { useState } from "react";

interface CapturedPhotoProps {
  imageSrc: string;
  onRetake: () => void;
  onRemove: () => void;
  onApprove?: () => void;
}

export const CapturedPhoto = ({
  imageSrc,
  onRetake,
  onRemove,
  onApprove,
}: CapturedPhotoProps) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div>
      {/* Photo preview section */}
      <div
        className="relative cursor-pointer group"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <div
          className={`transition-all duration-300 ${
            isZoomed ? "scale-100" : "scale-95 hover:scale-100"
          }`}
        >
          <div className="relative aspect-[4/3] max-w-lg mx-auto">
            <Image
              src={imageSrc}
              alt="Captured selfie"
              width={600}
              height={450}
              className="w-full h-full object-cover rounded-t-xl"
              priority
            />
          </div>
        </div>
      </div>

      {/* Status and action section */}
      <div className="p-6">
        {/* Success message */}
        <div className="flex items-center mb-6 border border-green p-4 rounded-lg">
          <div className="rounded-full p-1 mr-4">
            <svg
              className="h-10 w-10 text-green"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-green">
              Photo captured successfully!
            </h3>
            <p className="text-sm mt-1">
              Please verify that your face and ID are clearly visible
            </p>
          </div>
        </div>

        {/* Question */}
        <h4 className="text-gray-700 text-center mb-5">
          If everything looks good, click <b>Next</b>. Otherwise, choose an action
          below:
        </h4>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <div className="flex flex-1 gap-3">
            <button
              type="button"
              onClick={onRemove}
              className="flex-1 px-4 py-2.5 border rounded-lg bg-white hover:bg-gray transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-1.5 text-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Remove
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="flex-1 px-4 py-2.5 border rounded-lg bg-white hover:bg-gray transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-1.5 text-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retake
            </button>
          </div>

          {onApprove && (
            <button
              type="button"
              onClick={onApprove}
              className="flex-1 px-4 py-2.5 rounded-lg text-white bg-blue shadow-sm shadow-blue/20 hover:bg-blue-dark transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Continue with this photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
