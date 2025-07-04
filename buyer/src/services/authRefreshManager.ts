/**
 * Centralized Authentication Refresh Manager
 * Handles all token refresh logic to prevent duplicate requests
 */

import { AUTH_API } from '@/config/api';
import { store } from '@/redux/store';
import { setTokens } from '@/redux/features/auth-slice';
import { getCrossTabAuth } from './crossTabAuth';

let globalRefreshInProgress = false;
let refreshPromise: Promise<boolean> | null = null;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 30000;
const REFRESH_LISTENERS = new Set<() => void>();

let refreshCounter = 0;
const refreshSources: string[] = [];

export interface RefreshOptions {
  source?: string;
  force?: boolean;
}

class AuthRefreshManager {
  private static instance: AuthRefreshManager | null = null;

  public static getInstance(): AuthRefreshManager {
    if (!AuthRefreshManager.instance) {
      AuthRefreshManager.instance = new AuthRefreshManager();
    }
    return AuthRefreshManager.instance;
  }

  private getVerifyToken(): string | null {
    // Try cross-tab service first
    const crossTabAuth = getCrossTabAuth();
    const verifyToken = crossTabAuth.getVerifyToken();
    
    if (verifyToken) {
      return verifyToken;
    }
    
    // Fallback to sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verifyToken');
    }
    return null;
  }

  private canRefresh(force = false): boolean {
    if (force) return true;
    
    const now = Date.now();
    return now - lastRefreshTime > MIN_REFRESH_INTERVAL;
  }

  public async refreshToken(options: RefreshOptions = {}): Promise<boolean> {
    const { source = 'unknown', force = false } = options;
    
    if (refreshPromise) {
      return await refreshPromise;
    }

    if (!this.canRefresh(force)) {
      return false;
    }

    const verifyToken = this.getVerifyToken();
    if (!verifyToken) {
      return false;
    }

    refreshPromise = this.performRefresh(source, verifyToken);
    
    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  private async performRefresh(source: string, verifyToken: string): Promise<boolean> {
    globalRefreshInProgress = true;
    lastRefreshTime = Date.now();
    refreshCounter++;
    refreshSources.push(`${refreshCounter}: ${source} at ${new Date().toLocaleTimeString()}`);
    
    if (refreshSources.length > 10) {
      refreshSources.shift();
    }

    try {
      const response = await fetch(AUTH_API.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': verifyToken,
        },
        body: JSON.stringify({}),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token && data.verifyToken) {
          store.dispatch(setTokens({
            token: data.token,
            verifyToken: data.verifyToken,
            skipCrossTab: false
          }));
          
          REFRESH_LISTENERS.forEach(listener => {
            try {
              listener();
            } catch (error) {
              console.error('Error in refresh listener:', error);
            }
          });
          
          return true;
        }
      }
    } catch (error) {
      console.error(`Token refresh error:`, error);
    } finally {
      globalRefreshInProgress = false;
    }

    return false;
  }

  public isCurrentlyRefreshing(): boolean {
    return globalRefreshInProgress;
  }

  public getLastRefreshTime(): number {
    return lastRefreshTime;
  }

  public getRefreshSources(): string[] {
    return [...refreshSources]; // Return copy
  }

  public addRefreshListener(listener: () => void): () => void {
    REFRESH_LISTENERS.add(listener);
    
    // Return unsubscribe function
    return () => {
      REFRESH_LISTENERS.delete(listener);
    };
  }

  public getDebugInfo() {
    return {
      isRefreshing: globalRefreshInProgress,
      lastRefreshTime,
      refreshCounter,
      refreshSources: this.getRefreshSources(),
      timeSinceLastRefresh: Date.now() - lastRefreshTime
    };
  }
}

// Export singleton instance
export const authRefreshManager = AuthRefreshManager.getInstance();

// Export convenience functions
export const refreshToken = (options?: RefreshOptions) => authRefreshManager.refreshToken(options);
export const isRefreshing = () => authRefreshManager.isCurrentlyRefreshing();
export const getLastRefreshTime = () => authRefreshManager.getLastRefreshTime();
export const addRefreshListener = (listener: () => void) => authRefreshManager.addRefreshListener(listener);
export const getRefreshDebugInfo = () => authRefreshManager.getDebugInfo();