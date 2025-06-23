import React from 'react';
import { getCodeExpirationInfo } from '@/utils/codeUtils';

interface ExpirationBadgeProps {
  expirationDate?: string;
  className?: string;
}

const ExpirationBadge: React.FC<ExpirationBadgeProps> = ({ expirationDate, className = "" }) => {
  if (!expirationDate) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green/10 text-green ${className}`}>
        Never expires
      </span>
    );
  }

  const expirationInfo = getCodeExpirationInfo(expirationDate);
  
  if (!expirationInfo) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green/10 text-green ${className}`}>
        Never expires
      </span>
    );
  }

  if (expirationInfo.isExpired) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red/10 text-red ${className}`}>
        Expired
      </span>
    );
  }

  if (expirationInfo.isExpiringSoon) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow/10 text-yellow-dark ${className}`}>
        Expires in {expirationInfo.daysUntilExpiration} day{expirationInfo.daysUntilExpiration === 1 ? "" : "s"}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue/10 text-blue ${className}`}>
      Expires {expirationInfo.formattedExpiration}
    </span>
  );
};

export default ExpirationBadge;