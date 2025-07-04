'use client';

import { useEffect, useState } from 'react';
import { getRefreshDebugInfo } from '@/services/authRefreshManager';

/**
 * Simple Auth Monitor that doesn't depend on Redux
 * Fallback version in case of Redux context issues
 */
export const SimpleAuthMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const updateDebugInfo = () => {
      try {
        setDebugInfo(getRefreshDebugInfo());
      } catch (err) {
        console.error('SimpleAuthMonitor error:', err);
      }
    };
    
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 3000);
    
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px',
      borderRadius: '4px',
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <div 
        style={{ cursor: 'pointer', marginBottom: '5px' }}
        onClick={() => setIsVisible(!isVisible)}
      >
        🔄 Simple Auth Monitor (#{debugInfo?.refreshCounter || 0}) {isVisible ? '▼' : '▶'}
      </div>
      
      {isVisible && (
        <div>
          <div style={{ marginBottom: '5px', fontSize: '10px' }}>
            Refreshing: {debugInfo?.isRefreshing ? '🔄 Yes' : '⏸️ No'}<br/>
            Last: {debugInfo?.lastRefreshTime ? new Date(debugInfo.lastRefreshTime).toLocaleTimeString() : 'Never'}<br/>
            Since: {debugInfo?.timeSinceLastRefresh ? Math.round(debugInfo.timeSinceLastRefresh / 1000) + 's' : 'N/A'}
          </div>
          
          <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '9px' }}>
            <strong>Recent Sources:</strong>
            {debugInfo?.refreshSources?.length ? (
              debugInfo.refreshSources.slice(-5).map((source: string, index: number) => (
                <div key={index} style={{ 
                  marginBottom: '1px', 
                  padding: '1px',
                  backgroundColor: 'rgba(0, 255, 0, 0.1)'
                }}>
                  {source}
                </div>
              ))
            ) : (
              <div>No refresh events yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};