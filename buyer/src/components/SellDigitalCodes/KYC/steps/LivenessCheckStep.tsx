import { StepProps } from "../types";
import { ChangeEvent } from "react";

const LivenessCheckStep = ({ formData, handleFileUpload }: StepProps) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(field, file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-dark">Liveness Check</h2>
      <p className="text-sm text-gray-600">
        Please provide a clear selfie photo and a short video of yourself to verify your identity.
        The video should show you holding your ID and saying "I am [your full name] and I am applying
        for seller verification on [current date]."
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark">Selfie Photo</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="selfiePhoto"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue hover:text-blue-dark focus-within:outline-none"
                >
                  <span>Upload selfie</span>
                  <input
                    id="selfiePhoto"
                    name="selfiePhoto"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFileChange(e, 'selfiePhoto')}
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark">Verification Video</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8m-8-5h8m-8 5h8a1 1 0 011 1v3a1 1 0 01-1 1h-8a1 1 0 01-1-1v-3a1 1 0 011-1z"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="verificationVideo"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue hover:text-blue-dark focus-within:outline-none"
                >
                  <span>Upload video</span>
                  <input
                    id="verificationVideo"
                    name="verificationVideo"
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={(e) => handleFileChange(e, 'verificationVideo')}
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">MP4, MOV up to 50MB, max 30 seconds</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Make sure you are in a well-lit area and your face is clearly visible in both the photo and video.
              The video should be recorded in landscape orientation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivenessCheckStep; 