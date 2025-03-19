import { StepProps } from "../types";
import { ChangeEvent, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import Image from "next/image";
import styles from "./LivenessCheckStep.module.css";

const LivenessCheckStep = ({ formData, handleInputChange, handleFileChange, handleDateChange }: StepProps) => {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(formData?.selfiePreview || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showGuideOverlay, setShowGuideOverlay] = useState(true);
  const webcamRef = useRef<Webcam>(null);

  const startWebcam = useCallback(() => {
    setIsWebcamActive(true);
    setShowGuideOverlay(true);
  }, []);

  const stopWebcam = useCallback(() => {
    setIsWebcamActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      setIsCapturing(true);
      setShowFlash(true);
      
      // Play camera shutter sound
      const audio = new Audio('/sounds/camera-shutter.mp3');
      audio.play().catch(() => {
        // Ignore audio play error - some browsers block autoplay
      });

      // Remove flash effect after 150ms
      setTimeout(() => {
        setShowFlash(false);
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          setCapturedImage(imageSrc);
          // Convert base64 to blob
          fetch(imageSrc)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
              // Create a synthetic event with the file
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
              
              handleFileChange(syntheticEvent);
              // Store the preview URL in form data
              handleInputChange({
                target: {
                  name: 'selfiePreview',
                  value: imageSrc
                }
              } as unknown as ChangeEvent<HTMLInputElement>);
              setIsCapturing(false);
              setIsWebcamActive(false);
            });
        }
      }, 150);
    }
  }, [handleFileChange, handleInputChange]);

  const removePhoto = useCallback(() => {
    setCapturedImage(null);
    // Clear both the file and preview from form data
    handleFileChange({
      target: {
        name: 'selfie',
        files: null
      }
    } as unknown as ChangeEvent<HTMLInputElement>);
    handleInputChange({
      target: {
        name: 'selfiePreview',
        value: ''
      }
    } as unknown as ChangeEvent<HTMLInputElement>);
  }, [handleFileChange, handleInputChange]);

  const toggleGuideOverlay = useCallback(() => {
    setShowGuideOverlay(prev => !prev);
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-2xl font-semibold text-dark mb-2">Identity Verification</h2>
        <div className="h-1 w-24 bg-blue mb-4 rounded-full"></div>
        
        <p className="text-gray-600 mb-6">
          Take a clear photo of yourself holding your ID to verify your identity. 
          This helps us ensure the security of your account.
        </p>

        <div className="space-y-6">
          <div>
            {!isWebcamActive && !capturedImage ? (
              <div className="flex flex-col items-center bg-gray-50 rounded-xl p-8 border-2 border-dashed border-gray-200 transition-all hover:border-blue hover:bg-gray-100/50">
                <div className="rounded-full bg-blue-light-6 p-4 mb-4">
                  <svg className="h-10 w-10 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-dark mb-2">Take Your Verification Photo</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Hold your ID card next to your face and make sure both are clearly visible
                </p>
                <button
                  type="button"
                  onClick={startWebcam}
                  className="flex items-center px-6 py-3 rounded-lg text-white bg-blue shadow-lg shadow-blue/20 hover:bg-blue-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Start Camera
                </button>
              </div>
            ) : isWebcamActive ? (
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
                  
                  {/* Camera frame overlay */}
                  <div className={styles.cameraFrame}>
                    <div className={`${styles.cameraCorner} ${styles.topLeft}`} />
                    <div className={`${styles.cameraCorner} ${styles.topRight}`} />
                    <div className={`${styles.cameraCorner} ${styles.bottomLeft}`} />
                    <div className={`${styles.cameraCorner} ${styles.bottomRight}`} />
                  </div>
                  
                  {/* Guide overlay */}
                  {showGuideOverlay && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg p-5 max-w-md">
                        <h3 className="text-lg font-semibold text-dark mb-2">How to take a good verification photo</h3>
                        <ul className="space-y-2 mb-4">
                          <li className="flex items-start">
                            <svg className="w-5 h-5 text-green mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Hold your ID card next to your face at eye level
                          </li>
                          <li className="flex items-start">
                            <svg className="w-5 h-5 text-green mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Ensure your face and ID details are clearly visible
                          </li>
                          <li className="flex items-start">
                            <svg className="w-5 h-5 text-green mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Find a well-lit area without backlighting
                          </li>
                        </ul>
                        <button 
                          className="w-full py-2 bg-blue text-white rounded-lg hover:bg-blue-dark transition-all"
                          onClick={toggleGuideOverlay}
                        >
                          Got it
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {!showGuideOverlay && (
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={toggleGuideOverlay}
                      className="text-blue hover:text-blue-dark flex items-center"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Show tips
                    </button>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={stopWebcam}
                        disabled={isCapturing}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={isCapturing}
                        className="flex items-center justify-center px-6 py-2 text-white rounded-lg bg-dark transition-all hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                      >
                        {isCapturing ? (
                          <>
                            <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Take Photo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl overflow-hidden shadow-lg max-w-md mx-auto relative">
                  <Image
                    src={capturedImage!}
                    alt="Captured selfie"
                    width={500}
                    height={375}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700 font-medium">
                        Photo captured successfully!
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        You can now proceed to the next step or retake the photo if needed.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="px-5 py-2 border border-transparent rounded-lg text-white bg-blue hover:bg-blue-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-amber-400"
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
            <h3 className="text-sm font-medium text-amber-800">Verification Tips</h3>
            <div className="mt-2 text-sm text-amber-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Use adequate lighting to ensure your face and ID are clearly visible</li>
                <li>Remove sunglasses, hats, or other items that may obstruct facial recognition</li>
                <li>Position your ID card next to your face so both are clearly visible</li>
                <li>Avoid glare on your ID by adjusting the angle as needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivenessCheckStep;