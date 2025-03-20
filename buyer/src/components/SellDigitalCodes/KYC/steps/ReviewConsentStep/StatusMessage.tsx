import { AlertCircle, CheckCircle } from "lucide-react";
import { useAnimatedDots } from "../../hooks/useAnimatedDots";

interface StatusMessageProps {
  isAllConsentGiven: boolean;
}

const StatusMessage = ({ isAllConsentGiven }: StatusMessageProps) => {
  const { getDots } = useAnimatedDots(!isAllConsentGiven);

  if (isAllConsentGiven) {
    return (
      <div className="mt-6 flex items-center p-4 bg-green-light-6 rounded-lg border border-green-light-4">
        <CheckCircle className="h-5 w-5 text-green mr-3" />
        <p className="text-sm text-green-dark font-medium">
          All consents provided. {"You're"} ready to submit your application.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-start p-4 bg-amber-50 text-amber-800 rounded-lg">
      <AlertCircle className="h-5 w-5 flex-shrink-0 mr-3 mt-0.5" />
      <div className="text-sm flex items-center">
        <span>Please agree to all consent items to proceed</span>
        <span className="inline-block min-w-4 ml-1">{getDots()}</span>
      </div>
    </div>
  );
};

export default StatusMessage; 