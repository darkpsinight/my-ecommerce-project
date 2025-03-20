import { AlertCircle, CheckCircle } from "lucide-react";
import { useAnimatedDots } from "../../hooks/useAnimatedDots";

interface StatusIndicatorProps {
  isAllConsentGiven: boolean;
}

const StatusIndicator = ({ isAllConsentGiven }: StatusIndicatorProps) => {
  const { getDots } = useAnimatedDots(!isAllConsentGiven);

  return (
    <div
      className={`px-3 py-2 rounded-full text-sm font-medium flex items-center whitespace-nowrap ${
        isAllConsentGiven
          ? "bg-green-light-6 text-green"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {isAllConsentGiven ? (
        <>
          <CheckCircle className="h-4 w-4 mr-1 text-green" />
          <span className="text-green font-semibold">Ready to Submit</span>
        </>
      ) : (
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
          <span className="mr-1">Consent Required</span>
          <span className="inline-block min-w-4 text-left">{getDots()}</span>
        </div>
      )}
    </div>
  );
};

export default StatusIndicator; 