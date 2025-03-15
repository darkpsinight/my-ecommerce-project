"use client";

interface StepperUIProps {
  currentStep: number;
  steps: {
    title: string;
    description: string;
  }[];
}

const StepperUI = ({ currentStep, steps }: StepperUIProps) => {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex w-full max-w-2xl mx-auto justify-between"> {/* Added justify-between */}
        {steps.map((step, index) => {
          const isActive = index + 1 === currentStep;
          const isCompleted = index + 1 < currentStep;
          const isLast = index === steps.length - 1;
          const isWaiting = index + 1 > currentStep;

          return (
            <li key={step.title} className="relative flex-1"> {/* Always use flex-1 */}
              <div className="group flex flex-col items-center">
                {/* Line connector */}
                {!isLast && (
                  <div 
                    className="absolute top-4 left-[calc(50%+16px)] w-full"
                    aria-hidden="true"
                  >
                    <div 
                      className={`h-[2px] w-full ${isCompleted ? "bg-blue" : "bg-gray-200"}`}
                    />
                  </div>
                )}

                {/* Step Circle */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                    ${isCompleted || isActive ? "bg-blue text-white" : "bg-white text-gray-500"}
                    ${isWaiting ? "border-2 border-gray-200" : ""}`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step Title & Description */}
                <div className="mt-2 w-full text-center">
                  <p 
                    className={`text-xs font-medium leading-4 ${
                      isActive || isCompleted ? "text-blue" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-3 px-1">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepperUI;