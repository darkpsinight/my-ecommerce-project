interface StartCaptureProps {
  onStart: () => void;
}

export const StartCapture = ({ onStart }: StartCaptureProps) => {
  return (
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
        onClick={onStart}
        className="flex items-center px-6 py-3 rounded-lg text-white bg-blue shadow-lg shadow-blue/20 hover:bg-blue-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Start Camera
      </button>
    </div>
  );
}; 