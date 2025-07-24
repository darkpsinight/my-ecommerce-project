/**
 * Example component showing how to integrate time tracking
 * This would typically be used in your product detail page component
 */

import React, { useEffect, useState } from 'react';
import { useTimeTracking } from '../utils/timeTracking';

interface TimeTrackingExampleProps {
  productId: string;
  productTitle: string;
}

const TimeTrackingExample: React.FC<TimeTrackingExampleProps> = ({ 
  productId, 
  productTitle 
}) => {
  const { startTracking, stopTracking, getSessionInfo } = useTimeTracking(productId);
  const [sessionInfo, setSessionInfo] = useState<{ duration: number; isActive: boolean } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Start tracking when component mounts
  useEffect(() => {
    console.log(`🚀 Starting time tracking for product: ${productTitle}`);
    const id = startTracking();
    setSessionId(id);

    // Update session info every second for demo purposes
    const interval = setInterval(() => {
      const info = getSessionInfo();
      setSessionInfo(info);
    }, 1000);

    // Cleanup on unmount
    return () => {
      console.log(`🛑 Stopping time tracking for product: ${productTitle}`);
      clearInterval(interval);
      stopTracking();
    };
  }, [productId, productTitle, startTracking, stopTracking, getSessionInfo]);

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="time-tracking-info" style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div><strong>Time Tracking Debug</strong></div>
      <div>Product: {productTitle}</div>
      <div>Session ID: {sessionId}</div>
      {sessionInfo && (
        <>
          <div>Time on page: {formatDuration(sessionInfo.duration)}</div>
          <div>Status: {sessionInfo.isActive ? '🟢 Active' : '🔴 Inactive'}</div>
        </>
      )}
    </div>
  );
};

export default TimeTrackingExample;

// Example of how to use in your product page component:
/*
import TimeTrackingExample from './TimeTrackingExample';

const ProductDetailPage = ({ product }) => {
  return (
    <div>
      <TimeTrackingExample 
        productId={product.id} 
        productTitle={product.title} 
      />
      
      <h1>{product.title}</h1>
      <p>{product.description}</p>
      <div>Price: ${product.price}</div>
      
      // ... rest of your product page content
    </div>
  );
};
*/