/**
 * Time tracking utility for measuring time spent on listing pages
 */

interface SessionData {
  productId: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
  isActive: boolean;
}

class TimeTracker {
  private sessions: Map<string, SessionData> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly MAX_IDLE_TIME = 60000; // 1 minute
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

  constructor() {
    // Set up page visibility change listeners
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
      
      // Track user activity
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, this.updateActivity.bind(this), true);
      });
    }
  }

  /**
   * Start tracking time for a product page
   */
  startSession(productId: string, anonymousId?: string): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    // End any existing session for this product
    this.endSession(productId);
    
    const sessionData: SessionData = {
      productId,
      sessionId,
      startTime: now,
      lastActivity: now,
      isActive: true
    };
    
    this.sessions.set(productId, sessionData);
    
    // Start heartbeat if not already running
    if (!this.heartbeatInterval) {
      this.startHeartbeat();
    }
    
    console.log(`⏱️ Started time tracking for product ${productId}, session ${sessionId}`);
    return sessionId;
  }

  /**
   * End tracking for a product page
   */
  endSession(productId: string): void {
    const session = this.sessions.get(productId);
    if (!session || !session.isActive) {
      return;
    }

    const duration = Date.now() - session.startTime;
    session.isActive = false;
    
    // Send final duration to backend
    this.sendSessionEnd(session, duration);
    
    this.sessions.delete(productId);
    console.log(`⏱️ Ended time tracking for product ${productId}, duration: ${Math.round(duration / 1000)}s`);
    
    // Stop heartbeat if no active sessions
    if (this.sessions.size === 0 && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Update activity timestamp for all active sessions
   */
  private updateActivity(): void {
    const now = Date.now();
    this.sessions.forEach(session => {
      if (session.isActive) {
        session.lastActivity = now;
      }
    });
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden, pause tracking
      this.sessions.forEach(session => {
        if (session.isActive) {
          session.isActive = false;
        }
      });
    } else {
      // Page is visible again, resume tracking
      const now = Date.now();
      this.sessions.forEach(session => {
        // Only resume if not idle for too long
        if (!session.isActive && (now - session.lastActivity) < this.MAX_IDLE_TIME) {
          session.isActive = true;
          session.lastActivity = now;
        }
      });
    }
  }

  /**
   * Handle page unload
   */
  private handlePageUnload(): void {
    // End all active sessions
    this.sessions.forEach((session, productId) => {
      if (session.isActive) {
        this.endSession(productId);
      }
    });
  }

  /**
   * Start heartbeat to send activity updates
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Send heartbeat to backend for active sessions
   */
  private async sendHeartbeat(): void {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive);
    
    for (const session of activeSessions) {
      // Check if session has been idle too long
      const idleTime = Date.now() - session.lastActivity;
      if (idleTime > this.MAX_IDLE_TIME) {
        session.isActive = false;
        continue;
      }

      try {
        await this.sendActivityUpdate(session);
      } catch (error) {
        console.warn('Failed to send activity update:', error);
      }
    }
  }

  /**
   * Send activity update to backend
   */
  private async sendActivityUpdate(session: SessionData): Promise<void> {
    const anonymousId = this.getAnonymousId();
    
    const response = await fetch(`${this.API_BASE_URL}/viewed-products/session/activity`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        productId: session.productId,
        sessionId: session.sessionId,
        anonymousId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  /**
   * Send session end to backend
   */
  private async sendSessionEnd(session: SessionData, duration: number): Promise<void> {
    const anonymousId = this.getAnonymousId();
    
    try {
      const response = await fetch(`${this.API_BASE_URL}/viewed-products/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: session.productId,
          sessionId: session.sessionId,
          finalDuration: duration,
          anonymousId
        })
      });

      if (!response.ok) {
        console.warn(`Failed to send session end: HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send session end:', error);
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create anonymous ID for tracking
   */
  private getAnonymousId(): string {
    if (typeof window === 'undefined') return '';
    
    let anonymousId = localStorage.getItem('anonymous_id');
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymous_id', anonymousId);
    }
    return anonymousId;
  }

  /**
   * Get current session info for a product
   */
  getSessionInfo(productId: string): { duration: number; isActive: boolean } | null {
    const session = this.sessions.get(productId);
    if (!session) return null;

    return {
      duration: Date.now() - session.startTime,
      isActive: session.isActive
    };
  }

  /**
   * Clean up all sessions and intervals
   */
  destroy(): void {
    this.sessions.forEach((_, productId) => {
      this.endSession(productId);
    });
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Create singleton instance
export const timeTracker = new TimeTracker();

// Export hook for React components
export const useTimeTracking = (productId: string | null) => {
  const startTracking = () => {
    if (productId) {
      return timeTracker.startSession(productId);
    }
    return null;
  };

  const stopTracking = () => {
    if (productId) {
      timeTracker.endSession(productId);
    }
  };

  const getSessionInfo = () => {
    if (productId) {
      return timeTracker.getSessionInfo(productId);
    }
    return null;
  };

  return {
    startTracking,
    stopTracking,
    getSessionInfo
  };
};