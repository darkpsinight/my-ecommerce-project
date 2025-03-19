interface GuideOverlayProps {
  onClose: () => void;
}

export const GuideOverlay = ({ onClose }: GuideOverlayProps) => (
  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
    <div className="bg-white rounded-lg p-2 xsm:p-3 sm:p-5 w-full max-w-[280px] xsm:max-w-[300px] sm:max-w-md mx-auto flex flex-col max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between mb-1 xsm:mb-2 sm:mb-4">
        <h3 className="text-xs xsm:text-sm sm:text-lg font-semibold text-dark">How to take a good photo</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close guide"
        >
          <svg className="w-3 h-3 xsm:w-4 xsm:h-4 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="overflow-y-auto flex-grow mb-1 xsm:mb-2 sm:mb-4 -mx-2 px-2">
        <ul className="space-y-1 xsm:space-y-2 sm:space-y-3">
          <GuideItem>
            Hold your ID card next to your face at eye level
          </GuideItem>
          <GuideItem>
            Ensure your face and ID details are clearly visible
          </GuideItem>
          <GuideItem>
            Find a well-lit area without backlighting
          </GuideItem>
          <GuideItem>
            Keep your phone steady and centered
          </GuideItem>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-1 xsm:gap-2 sm:gap-3 mt-auto sticky bottom-0 bg-white pt-1">
        <button 
          className="w-full py-1 xsm:py-1.5 sm:py-2.5 px-2 xsm:px-3 sm:px-4 bg-blue text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-dark transition-all"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  </div>
);

const GuideItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-1 xsm:gap-1.5 sm:gap-2">
    <div className="flex-shrink-0 w-3 h-3 xsm:w-4 xsm:h-4 sm:w-5 sm:h-5 mt-0.5">
      <svg className="w-3 h-3 xsm:w-4 xsm:h-4 sm:w-5 sm:h-5 text-green" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </div>
    <span className="text-2xs xsm:text-xs sm:text-base text-gray-700 leading-tight">{children}</span>
  </li>
); 