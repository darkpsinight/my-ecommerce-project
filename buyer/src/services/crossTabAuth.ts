/**
 * Cross-Tab Authentication Service
 * Manages authentication state synchronization across browser tabs
 * while maintaining security best practices for marketplace transactions
 */

interface AuthBroadcastData {
  type: 'TOKEN_UPDATE' | 'TOKEN_CLEAR' | 'AUTH_REQUEST' | 'AUTH_RESPONSE';
  payload?: {
    token?: string;
    verifyToken?: string;
    timestamp?: number;
  };
  tabId?: string;
}

interface AuthState {
  token: string | null;
  verifyToken: string | null;
  isAuthenticated: boolean;
  lastUpdate: number;
}

class CrossTabAuthService {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private currentState: AuthState = {
    token: null,
    verifyToken: null,
    isAuthenticated: false,
    lastUpdate: 0
  };

  constructor() {
    this.tabId = this.generateTabId();
    this.initializeBroadcastChannel();
    this.loadInitialState();
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeBroadcastChannel(): void {
    if (typeof window === 'undefined' || !window.BroadcastChannel) {
      console.warn('BroadcastChannel not supported, falling back to single-tab mode');
      return;
    }

    try {
      this.channel = new BroadcastChannel('auth_sync');
      this.channel.addEventListener('message', this.handleBroadcastMessage.bind(this));
      
      // Request current auth state from other tabs
      this.requestAuthStateFromOtherTabs();
    } catch (error) {
      console.warn('Failed to initialize BroadcastChannel:', error);
    }
  }

  private loadInitialState(): void {
    if (typeof window === 'undefined') return;

    // Try to load from sessionStorage first
    try {
      const verifyToken = sessionStorage.getItem('verifyToken');
      if (verifyToken) {
        this.currentState.verifyToken = verifyToken;
        // Don't set isAuthenticated yet - let the auth system handle token refresh
      }
    } catch (error) {
      console.warn('Failed to load from sessionStorage:', error);
    }
  }

  private handleBroadcastMessage(event: MessageEvent<AuthBroadcastData>): void {
    const { type, payload, tabId } = event.data;

    // Ignore messages from the same tab
    if (tabId === this.tabId) return;

    switch (type) {
      case 'TOKEN_UPDATE':
        if (payload?.token && payload?.verifyToken && payload?.timestamp) {
          // Only update if the received state is newer
          if (payload.timestamp > this.currentState.lastUpdate) {
            this.updateState({
              token: payload.token,
              verifyToken: payload.verifyToken,
              isAuthenticated: true,
              lastUpdate: payload.timestamp
            });
          }
        }
        break;

      case 'TOKEN_CLEAR':
        if (payload?.timestamp && payload.timestamp > this.currentState.lastUpdate) {
          this.updateState({
            token: null,
            verifyToken: null,
            isAuthenticated: false,
            lastUpdate: payload.timestamp
          });
          // Clear sessionStorage in this tab too
          this.clearSessionStorage();
        }
        break;

      case 'AUTH_REQUEST':
        // Another tab is requesting current auth state
        if (this.currentState.isAuthenticated && this.currentState.token && this.currentState.verifyToken) {
          this.broadcastMessage({
            type: 'AUTH_RESPONSE',
            payload: {
              token: this.currentState.token,
              verifyToken: this.currentState.verifyToken,
              timestamp: this.currentState.lastUpdate
            }
          });
        }
        break;

      case 'AUTH_RESPONSE':
        // Received auth state from another tab
        if (payload?.token && payload?.verifyToken && payload?.timestamp) {
          if (payload.timestamp > this.currentState.lastUpdate && !this.currentState.isAuthenticated) {
            this.updateState({
              token: payload.token,
              verifyToken: payload.verifyToken,
              isAuthenticated: true,
              lastUpdate: payload.timestamp
            });
          }
        }
        break;
    }
  }

  private updateState(newState: AuthState): void {
    const oldState = { ...this.currentState };
    this.currentState = { ...newState };

    // Update sessionStorage for verifyToken
    if (newState.verifyToken && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('verifyToken', newState.verifyToken);
      } catch (error) {
        console.warn('Failed to save verifyToken to sessionStorage:', error);
      }
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  private broadcastMessage(data: Omit<AuthBroadcastData, 'tabId'>): void {
    if (!this.channel) return;

    try {
      this.channel.postMessage({
        ...data,
        tabId: this.tabId
      });
    } catch (error) {
      console.warn('Failed to broadcast auth message:', error);
    }
  }

  private requestAuthStateFromOtherTabs(): void {
    // Small delay to ensure other tabs are ready
    setTimeout(() => {
      this.broadcastMessage({ type: 'AUTH_REQUEST' });
    }, 100);
  }

  private clearSessionStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem('verifyToken');
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  }

  /**
   * Update authentication tokens and broadcast to other tabs
   */
  public setTokens(token: string, verifyToken: string): void {
    const timestamp = Date.now();
    
    this.updateState({
      token,
      verifyToken,
      isAuthenticated: true,
      lastUpdate: timestamp
    });

    // Broadcast to other tabs
    this.broadcastMessage({
      type: 'TOKEN_UPDATE',
      payload: { token, verifyToken, timestamp }
    });
  }

  /**
   * Clear authentication tokens and broadcast to other tabs
   */
  public clearTokens(): void {
    const timestamp = Date.now();
    
    this.updateState({
      token: null,
      verifyToken: null,
      isAuthenticated: false,
      lastUpdate: timestamp
    });

    // Clear sessionStorage
    this.clearSessionStorage();

    // Broadcast to other tabs
    this.broadcastMessage({
      type: 'TOKEN_CLEAR',
      payload: { timestamp }
    });
  }

  /**
   * Get current authentication state
   */
  public getState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to authentication state changes
   */
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get verify token from current state or sessionStorage
   */
  public getVerifyToken(): string | null {
    if (this.currentState.verifyToken) {
      return this.currentState.verifyToken;
    }
    
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('verifyToken');
      } catch (error) {
        console.warn('Failed to get verifyToken from sessionStorage:', error);
      }
    }
    
    return null;
  }

  /**
   * Check if currently authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentState.isAuthenticated && !!this.currentState.token;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

// Create singleton instance
let crossTabAuthInstance: CrossTabAuthService | null = null;

export const getCrossTabAuth = (): CrossTabAuthService => {
  if (!crossTabAuthInstance) {
    crossTabAuthInstance = new CrossTabAuthService();
  }
  return crossTabAuthInstance;
};

export type { AuthState, AuthBroadcastData };