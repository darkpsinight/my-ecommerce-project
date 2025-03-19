import { ChangeEvent, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import styles from "../LivenessCheckStep.module.css";
import { GuideOverlay } from "./GuideOverlay";

interface WebcamCaptureProps {
  onCapture: (event: ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onCaptureComplete: (imageSrc: string) => void;
}

export const WebcamCapture = ({ onCapture, onInputChange, onCancel, onCaptureComplete }: WebcamCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showGuideOverlay, setShowGuideOverlay] = useState(true);
  const webcamRef = useRef<Webcam>(null);

  const toggleGuideOverlay = useCallback(() => {
    setShowGuideOverlay(prev => !prev);
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      setIsCapturing(true);
      setShowFlash(true);
      
      const audio = new Audio('/sounds/camera-shutter.mp3');
      audio.play().catch(() => {
        // Ignore audio play error
      });

      setTimeout(() => {
        setShowFlash(false);
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          // Convert base64 to blob
          fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              
              const syntheticEvent = {
                target: {
                  name: 'selfie',
                  files: dataTransfer.files
                },
                currentTarget: {
                  name: 'selfie',
                  files: dataTransfer.files
                }
              } as unknown as ChangeEvent<HTMLInputElement>;
              
              // First update the form data
              onCapture(syntheticEvent);
              onInputChange({
                target: {
                  name: 'selfiePreview',
                  value: imageSrc
                }
              } as unknown as ChangeEvent<HTMLInputElement>);
              
              // Then complete the capture with the image
              setIsCapturing(false);
              onCaptureComplete(imageSrc);
            })
            .catch(error => {
              console.error('Error processing captured photo:', error);
              setIsCapturing(false);
            });
        } else {
          setIsCapturing(false);
        }
      }, 150);
    }
  }, [onCapture, onInputChange, onCaptureComplete]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden shadow-lg">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full h-full rounded-lg"
          videoConstraints={{ facingMode: "user" }}
        />
        {showFlash && <div className={styles.flashOverlay} />}
        
        <div className={styles.cameraFrame}>
          <div className={`${styles.cameraCorner} ${styles.topLeft}`} />
          <div className={`${styles.cameraCorner} ${styles.topRight}`} />
          <div className={`${styles.cameraCorner} ${styles.bottomLeft}`} />
          <div className={`${styles.cameraCorner} ${styles.bottomRight}`} />
        </div>
        
        {showGuideOverlay && <GuideOverlay onClose={toggleGuideOverlay} />}
      </div>
      
      {!showGuideOverlay && (
        <CameraControls
          onShowTips={toggleGuideOverlay}
          onCancel={onCancel}
          onCapture={capturePhoto}
          isCapturing={isCapturing}
        />
      )}
    </div>
  );
};

interface CameraControlsProps {
  onShowTips: () => void;
  onCancel: () => void;
  onCapture: () => void;
  isCapturing: boolean;
}

const CameraControls = ({ onShowTips, onCancel, onCapture, isCapturing }: CameraControlsProps) => (
  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
    <button
      type="button"
      onClick={onShowTips}
      className="text-blue hover:text-blue-dark flex items-center text-sm sm:text-base"
    >
      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Show tips
    </button>
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isCapturing}
        className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm sm:text-base bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onCapture}
        disabled={isCapturing}
        className="flex items-center justify-center px-4 sm:px-6 py-2 text-white rounded-lg bg-dark transition-all hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] sm:min-w-[140px] text-sm sm:text-base"
      >
        {isCapturing ? (
          <>
            <svg className="animate-spin mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take Photo
          </>
        )}
      </button>
    </div>
  </div>
); 