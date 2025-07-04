'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getRefreshDebugInfo } from '@/services/authRefreshManager';

interface RefreshEvent {
  timestamp: number;
  source: string;
  success: boolean;
}

/**
 * Development component to monitor token refresh events
 * Only shows in development mode
 */
export const AuthRefreshMonitor = () => {
  const [refreshEvents, setRefreshEvents] = useState<RefreshEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Safely get token with error handling
  let token: string | null = null;
  try {
    const authState = useSelector((state: any) => state?.authReducer);
    token = authState?.token || null;
  } catch (err) {
    setError('Redux connection error');
    console.error('AuthRefreshMonitor Redux error:', err);
  }

  // Update debug info periodically
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const updateDebugInfo = () => {
      try {
        setDebugInfo(getRefreshDebugInfo());
        setError(null);
      } catch (err) {
        console.error('AuthRefreshMonitor debug info error:', err);
        setError('Debug info error');
      }
    };
    
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);
    
    // Load test utilities
    import('../../utils/testRefreshFix').catch(err => {
      console.warn('Could not load test utilities:', err);
    });
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Intercept console.log to catch refresh events
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      
      // Check for refresh-related messages
      if (message.includes('Token refreshed successfully') || 
          message.includes('Refreshing token') ||
          message.includes('Attempting to refresh token')) {
        
        const event: RefreshEvent = {
          timestamp: Date.now(),
          source: message.includes('auth service') ? 'Auth Service' : 'Auth Hook',
          success: message.includes('successfully')
        };
        
        setRefreshEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
      }
      
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        backgroundColor: 'rgba(255, 0, 0, 0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        Auth Monitor Error: {error}
      </div>
    );
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
        🔄 Auth Monitor (#{debugInfo?.refreshCounter || 0}) {isVisible ? '▼' : '▶'}
      </div>
      
      {isVisible && (
        <div>
          <div style={{ marginBottom: '5px', fontSize: '10px' }}>
            Token: {token ? '✅ Present' : '❌ Missing'}<br/>
            Refreshing: {debugInfo?.isRefreshing ? '🔄 Yes' : '⏸️ No'}<br/>
            Last: {debugInfo?.lastRefreshTime ? new Date(debugInfo.lastRefreshTime).toLocaleTimeString() : 'Never'}<br/>
            Since: {debugInfo?.timeSinceLastRefresh ? Math.round(debugInfo.timeSinceLastRefresh / 1000) + 's' : 'N/A'}
          </div>
          
          <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '9px' }}>
            <strong>Recent Sources:</strong>
            {debugInfo?.refreshSources?.length ? (
              debugInfo.refreshSources.map((source: string, index: number) => (
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
          
          <button 
            onClick={() => {
              setRefreshEvents([]);
              // Reset debug info if needed
            }}
            style={{
              marginTop: '5px',
              padding: '2px 5px',
              fontSize: '10px',
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid white',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};