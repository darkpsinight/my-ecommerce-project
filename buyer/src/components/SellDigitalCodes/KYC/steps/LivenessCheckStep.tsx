import { StepProps } from "../types";
import { useState, useCallback } from "react";
import Image from "next/image";
import { WebcamCapture, CapturedPhoto, StartCapture } from "./LivenessCheck";

const LivenessCheckStep = ({ formData, handleInputChange, handleFileChange }: StepProps) => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(formData?.selfiePreview || null);
  const [isRetaking, setIsRetaking] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const startWebcam = useCallback(() => {
    setIsWebcamActive(true);
    setIsRetaking(true);
  }, []);
  
  const stopWebcam = useCallback(() => {
    setIsWebcamActive(false);
    if (isRetaking) {
      setCapturedImage(null);
      handleFileChange({
        target: {
          name: 'selfie',
          files: null
        }
      } as any);
      handleInputChange({
        target: {
          name: 'selfiePreview',
          value: ''
        }
      } as any);
    }
    setIsRetaking(false);
  }, [isRetaking, handleFileChange, handleInputChange]);

  const handleCaptureComplete = useCallback((imageSrc: string) => {
    setCapturedImage(imageSrc);
    setIsWebcamActive(false);
    setIsRetaking(false);
  }, []);

  const removePhoto = () => {
    setCapturedImage(null);
    handleFileChange({
      target: {
        name: 'selfie',
        files: null
      }
    } as any);
    handleInputChange({
      target: {
        name: 'selfiePreview',
        value: ''
      }
    } as any);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="border border-gray-100 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-dark">Liveness Check</h2>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="p-2 text-blue hover:text-blue-dark transition-colors"
            title="View guide"
          >
            <svg
              className="w-6 h-6"
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
        </div>
        <div className="h-1 w-24 bg-blue mb-4 rounded-full"></div>
        
        <p className="text-gray-600 mb-6">
          Please take a close-up photo of <b>your face</b> with the <b>front side of your ID</b>
        </p>

        <div className="space-y-6">
          {!isWebcamActive && !capturedImage ? (
            <StartCapture onStart={startWebcam} />
          ) : isWebcamActive ? (
            <WebcamCapture
              onCapture={handleFileChange}
              onInputChange={handleInputChange}
              onCancel={stopWebcam}
              onCaptureComplete={handleCaptureComplete}
            />
          ) : capturedImage && (
            <CapturedPhoto
              imageSrc={capturedImage}
              onRetake={startWebcam}
              onRemove={removePhoto}
            />
          )}
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-xl p-4 max-w-2xl w-full mx-4 border border-gray-100">
            <button
              type="button"
              onClick={() => setShowGuide(false)}
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
            <h3 className="text-xl font-semibold mb-4">KYC Photo Guide</h3>
            <div className="relative aspect-video w-full">
              <Image
                src="/images/kycGuide/KYC-Guide-Webcam.webp"
                alt="KYC Guide"
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

export default LivenessCheckStep;