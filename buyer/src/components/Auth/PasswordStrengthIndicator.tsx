import React from 'react';

interface PasswordStrength {
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    noDisallowed: boolean;
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  isFocused?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password,
  showRequirements = true,
  isFocused = false
}) => {
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-={}[\]:";',.?~`]/.test(password),
      noDisallowed: !/[<>[\]{}|]/.test(password),
    };

    // Calculate score based on met requirements
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const score = (metRequirements / 6) * 100;

    return {
      score,
      requirements
    };
  };

  const strength = checkPasswordStrength(password);

  const getStrengthLabel = (score: number): string => {
    if (score <= 33) return 'Weak';
    if (score <= 66) return 'Medium';
    if (score < 100) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = (score: number): string => {
    if (score === 0) return 'bg-gray-300';
    if (score <= 33) return 'bg-[#e53e3e]';  // red
    if (score <= 66) return 'bg-[#eab308]';  // yellow
    if (score < 100) return 'bg-blue';       // using our theme blue
    return 'bg-[#22c55e]';                   // green
  };

  if (!isFocused) return null;

  return (
    <div className="mt-2 border border-gray-200 rounded-lg p-4">
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>

      {/* Strength label */}
      <div className="flex items-center justify-between text-sm mt-2">
        <span className={`font-medium ${strength.score === 0 ? 'text-gray-500' : 'text-dark'}`}>
          {getStrengthLabel(strength.score)}
        </span>
        <span className="text-dark-5">{Math.round(strength.score)}%</span>
      </div>

      {/* Requirements list */}
      {showRequirements && (
        <div className="space-y-1 text-sm mt-3 pt-3 border-t border-gray-200">
          <div className={`flex items-center gap-2 ${strength.requirements.minLength ? 'text-green-600' : 'text-dark-5'}`}>
            {strength.requirements.minLength ? '✓' : '○'} At least 12 characters
          </div>
          <div className={`flex items-center gap-2 ${strength.requirements.hasUppercase ? 'text-green-600' : 'text-dark-5'}`}>
            {strength.requirements.hasUppercase ? '✓' : '○'} One uppercase letter
          </div>
          <div className={`flex items-center gap-2 ${strength.requirements.hasLowercase ? 'text-green-600' : 'text-dark-5'}`}>
            {strength.requirements.hasLowercase ? '✓' : '○'} One lowercase letter
          </div>
          <div className={`flex items-center gap-2 ${strength.requirements.hasNumber ? 'text-green-600' : 'text-dark-5'}`}>
            {strength.requirements.hasNumber ? '✓' : '○'} One number
          </div>
          <div className={`flex items-center gap-2 ${strength.requirements.hasSpecial ? 'text-green-600' : 'text-dark-5'}`}>
            {strength.requirements.hasSpecial ? '✓' : '○'} One special character
          </div>
          <div className={`flex items-center gap-2 ${strength.requirements.noDisallowed ? 'text-green-600' : 'text-dark-5'}`}>
            {strength.requirements.noDisallowed ? '✓' : '○'} No invalid characters (&lt;&gt;[]{}|)
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator; 