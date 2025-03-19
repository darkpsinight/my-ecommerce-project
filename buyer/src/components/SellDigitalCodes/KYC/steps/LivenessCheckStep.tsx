import { StepProps } from "../types";
import { useState, useCallback } from "react";
import { WebcamCapture, CapturedPhoto, StartCapture } from "./LivenessCheck";

const LivenessCheckStep = ({ formData, handleInputChange, handleFileChange }: StepProps) => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(formData?.selfiePreview || null);
  const [isRetaking, setIsRetaking] = useState(false);

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
        <h2 className="text-2xl font-semibold text-dark mb-2">Liveness Check</h2>
        <div className="h-1 w-24 bg-blue mb-4 rounded-full"></div>
        
        <p className="text-gray-600 mb-6">
          Take a clear photo of yourself holding your ID to verify your identity. 
          This helps us ensure the security of your account.
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
    </div>
  );
};

export default LivenessCheckStep;