import { ChangeEvent, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import styles from "../LivenessCheckStep.module.css";
import { GuideOverlay } from "./GuideOverlay";
import { CameraControls } from "./CameraControls";
import { CameraLoadingSpinner } from "./CameraLoadingSpinner";
import { CameraFrame } from "./CameraFrame";

interface WebcamCaptureProps {
  onCapture: (event: ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onCaptureComplete: (imageSrc: string) => void;
}

export const WebcamCapture = ({
  onCapture,
  onInputChange,
  onCancel,
  onCaptureComplete,
}: WebcamCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showGuideOverlay, setShowGuideOverlay] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const toggleGuideOverlay = useCallback(() => {
    setShowGuideOverlay((prev) => !prev);
  }, []);

  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;

    setIsCapturing(true);
    setShowFlash(true);

    const audio = new Audio("/sounds/camera-shutter.mp3");
    audio.play().catch(() => {
      // Ignore audio play error
    });

    setTimeout(() => {
      setShowFlash(false);
      const imageSrc = webcamRef.current?.getScreenshot();
      
      if (!imageSrc) {
        setIsCapturing(false);
        return;
      }

      // Convert base64 to blob
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          const syntheticEvent = {
            target: { name: "selfie", files: dataTransfer.files },
            currentTarget: { name: "selfie", files: dataTransfer.files },
          } as unknown as ChangeEvent<HTMLInputElement>;

          onCapture(syntheticEvent);
          onInputChange({
            target: { name: "selfiePreview", value: imageSrc },
          } as unknown as ChangeEvent<HTMLInputElement>);

          setIsCapturing(false);
          onCaptureComplete(imageSrc);
        })
        .catch((error) => {
          console.error("Error processing captured photo:", error);
          setIsCapturing(false);
        });
    }, 150);
  }, [onCapture, onInputChange, onCaptureComplete]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden shadow-lg">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className={`w-full h-full rounded-lg ${!isCameraReady ? "opacity-0" : "opacity-100"}`}
          videoConstraints={{ facingMode: "user" }}
          onUserMedia={handleUserMedia}
        />
        {!isCameraReady && <CameraLoadingSpinner />}
        {showFlash && <div className={styles.flashOverlay} />}
        <CameraFrame />
        {showGuideOverlay && isCameraReady && <GuideOverlay onClose={toggleGuideOverlay} />}
      </div>

      {!showGuideOverlay && (
        <CameraControls
          onShowTips={toggleGuideOverlay}
          onCancel={onCancel}
          onCapture={handleCapture}
          isCapturing={isCapturing}
        />
      )}
    </div>
  );
};
