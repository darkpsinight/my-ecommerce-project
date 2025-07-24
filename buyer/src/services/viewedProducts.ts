import axios from 'axios';
import { Product } from '@/types/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Types
interface ViewMetadata {
  source?: 'homepage' | 'search' | 'category' | 'recommendation' | 'related' | 'seller_profile' | 'wishlist' | 'direct' | 'other';
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'other';
  sessionId?: string;
  referrer?: string;
  viewDuration?: number;
}

interface ViewedProductData {
  productId: string;
  viewedAt: string;
  metadata?: ViewMetadata;
}

interface ViewedProductRecord {
  viewId: string;
  productId: string;
  viewedAt: string;
  metadata?: ViewMetadata;
  product?: Product;
}

interface ViewedProductsResponse {
  views: ViewedProductRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Constants
const STORAGE_KEY = 'viewedProducts';
const MAX_LOCAL_STORAGE_ITEMS = 50;
const VIEW_DEBOUNCE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

class ViewedProductsService {
  private isAuthenticated: boolean = false;
  private sessionId: string;
  private viewQueue: Map<string, NodeJS.Timeout> = new Map();
  private isMigrationInProgress: boolean = false;
  private lastMigrationTime: number = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.detectDevice = this.detectDevice.bind(this);
    this.isAuthenticated = this.checkAuthStatus();
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkAuthStatus(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      // Get token from Redux store (same as auth.ts)
      const { store } = require('@/redux/store');
      const state = store.getState();
      const token = state.authReducer.token;
      const isAuthenticated = !!token;
      
      console.log('[ViewedProducts] Auth check:', { 
        token: token ? 'EXISTS' : 'MISSING', 
        isAuthenticated,
        storeState: state.authReducer ? 'EXISTS' : 'MISSING',
        tokenLength: token ? token.length : 0
      });
      return isAuthenticated;
    } catch (error) {
      console.error('[ViewedProducts] Auth check failed:', error);
      return false;
    }
  }

  private detectDevice(): ViewMetadata['deviceType'] {
    if (typeof window === 'undefined') return 'other';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getAuthHeaders() {
    if (typeof window === 'undefined') return {};
    
    try {
      // Get token from Redux store (same as auth.ts)
      const { store } = require('@/redux/store');
      const token = store.getState().authReducer.token;
      
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      console.error('[ViewedProducts] getAuthHeaders: error getting token:', error);
      return {};
    }
  }

  // LocalStorage operations
  private getLocalStorageData(): ViewedProductData[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading viewed products from localStorage:', error);
      return [];
    }
  }

  private setLocalStorageData(data: ViewedProductData[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Keep only the most recent items
      const limitedData = data.slice(0, MAX_LOCAL_STORAGE_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedData));
    } catch (error) {
      console.error('Error saving viewed products to localStorage:', error);
    }
  }

  private addToLocalStorage(productId: string, metadata?: ViewMetadata): void {
    const existingData = this.getLocalStorageData();
    
    // Remove existing entry if it exists
    const filteredData = existingData.filter(item => item.productId !== productId);
    
    // Add new entry at the beginning
    const newEntry: ViewedProductData = {
      productId,
      viewedAt: new Date().toISOString(),
      metadata: {
        ...metadata,
        sessionId: this.sessionId,
        deviceType: this.detectDevice()
      }
    };
    
    filteredData.unshift(newEntry);
    this.setLocalStorageData(filteredData);
  }

  private clearLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing viewed products from localStorage:', error);
    }
  }

  // API operations
  private async addViewToDatabase(productId: string, metadata?: ViewMetadata): Promise<boolean> {
    try {
      const authHeaders = this.getAuthHeaders();
      
      const payload = {
        productId,
        metadata: {
          ...metadata,
          sessionId: this.sessionId,
          deviceType: this.detectDevice(),
          referrer: typeof window !== 'undefined' ? document.referrer : undefined
        }
      };
      
      // If viewDuration is provided, use session tracking
      if (metadata?.viewDuration !== undefined) {
        console.log('[ViewedProducts] Using session tracking for authenticated user with duration:', metadata.viewDuration);
        
        // First, create the initial view
        await axios.post(
          `${API_URL}/viewed-products`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders
            }
          }
        );
        
        // Then end the session with duration
        const sessionEndResponse = await axios.post(
          `${API_URL}/viewed-products/session/end`,
          {
            productId,
            sessionId: this.sessionId,
            finalDuration: metadata.viewDuration
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders
            }
          }
        );
        
        console.log('[ViewedProducts] Session ended with duration:', metadata.viewDuration);
        return (sessionEndResponse.data as any)?.success || false;
      } else {
        // Regular view tracking without duration
        const response = await axios.post(
          `${API_URL}/viewed-products`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders
            }
          }
        );

        return (response.data as any)?.success || false;
      }
    } catch (error) {
      console.error('[ViewedProducts] Error adding viewed product to database:', error);
      if ((error as any).response) {
        console.error('[ViewedProducts] Error response:', (error as any).response.data);
        console.error('[ViewedProducts] Error status:', (error as any).response.status);
      }
      return false;
    }
  }

  private async addAnonymousViewToDatabase(productId: string, metadata?: ViewMetadata): Promise<boolean> {
    try {
      const anonymousId = this.getAnonymousId();
      
      const payload = {
        productId,
        anonymousId,
        metadata: {
          ...metadata,
          sessionId: this.sessionId,
          deviceType: this.detectDevice(),
          referrer: typeof window !== 'undefined' ? document.referrer : undefined
        }
      };
      
      // If viewDuration is provided, use session tracking
      if (metadata?.viewDuration !== undefined) {
        console.log('[ViewedProducts] Using session tracking for anonymous user with duration:', metadata.viewDuration);
        
        // First, create the initial view
        await axios.post(
          `${API_URL}/viewed-products/anonymous`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Then end the session with duration
        const sessionEndResponse = await axios.post(
          `${API_URL}/viewed-products/session/end`,
          {
            productId,
            sessionId: this.sessionId,
            finalDuration: metadata.viewDuration,
            anonymousId
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('[ViewedProducts] Anonymous session ended with duration:', metadata.viewDuration);
        return (sessionEndResponse.data as any)?.success || false;
      } else {
        // Regular view tracking without duration
        const response = await axios.post(
          `${API_URL}/viewed-products/anonymous`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        return (response.data as any)?.success || false;
      }
    } catch (error) {
      console.error('[ViewedProducts] Error adding anonymous viewed product to database:', error);
      if ((error as any).response) {
        console.error('[ViewedProducts] Error response:', (error as any).response.data);
        console.error('[ViewedProducts] Error status:', (error as any).response.status);
      }
      return false;
    }
  }

  private getAnonymousId(): string {
    if (typeof window === 'undefined') return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let anonymousId = localStorage.getItem('anonymousUserId');
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymousUserId', anonymousId);
    }
    return anonymousId;
  }

  private async bulkAddToDatabase(products: ViewedProductData[]): Promise<{ successful: number; failed: number }> {
    try {
      const response = await axios.post(
        `${API_URL}/viewed-products/bulk`,
        { products },
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        }
      );

      if ((response.data as any)?.success) {
        return {
          successful: (response.data as any).data.successful || 0,
          failed: (response.data as any).data.failed || 0
        };
      }

      return { successful: 0, failed: products.length };
    } catch (error) {
      console.error('Error bulk adding viewed products to database:', error);
      return { successful: 0, failed: products.length };
    }
  }

  // Public methods
  public updateAuthStatus(isAuthenticated?: boolean): void {
    const wasAuthenticated = this.isAuthenticated;
    // If not explicitly provided, check current auth status
    this.isAuthenticated = isAuthenticated !== undefined ? isAuthenticated : this.checkAuthStatus();

    // Only migrate localStorage data if user JUST logged in (not on every page load)
    // and only if explicitly called with isAuthenticated=true
    if (!wasAuthenticated && this.isAuthenticated && isAuthenticated === true) {
      this.migrateLocalStorageToDatabase();
    }
  }

  public async addViewedProduct(productId: string, metadata?: ViewMetadata): Promise<void> {
    console.log('[ViewedProducts] addViewedProduct called:', { productId, metadata });
    
    if (!productId) {
      console.log('[ViewedProducts] No productId provided, returning');
      return;
    }

    // Clear any existing timeout for this product
    if (this.viewQueue.has(productId)) {
      console.log('[ViewedProducts] Clearing existing timeout for product:', productId);
      clearTimeout(this.viewQueue.get(productId)!);
    }

    console.log('[ViewedProducts] Setting 5-second debounce timeout (allowing time for auth)');
    
    // Set debounced timeout with longer delay to allow authentication to complete
    const timeout = setTimeout(async () => {
      console.log('[ViewedProducts] Timeout triggered, processing view...');
      this.viewQueue.delete(productId);
      
      // Check auth status at processing time (not call time) to get accurate status
      const currentAuthStatus = this.checkAuthStatus();
      
      // Update stored auth status to match current status  
      this.isAuthenticated = currentAuthStatus;
      
      console.log('[ViewedProducts] Processing view:', { 
        productId, 
        isAuthenticated: this.isAuthenticated,
        currentAuthStatus,
        storedAuthStatus: this.isAuthenticated,
        metadata 
      });
      
      if (this.isAuthenticated) {
        // User is authenticated, save to database
        console.log('[ViewedProducts] Calling addViewToDatabase for authenticated user');
        const success = await this.addViewToDatabase(productId, metadata);
        console.log('[ViewedProducts] addViewToDatabase result:', success);
      } else {
        // User is guest, save to localStorage AND database (anonymous)
        console.log('[ViewedProducts] Processing anonymous user view');
        this.addToLocalStorage(productId, metadata);
        console.log('[ViewedProducts] Calling addAnonymousViewToDatabase');
        const success = await this.addAnonymousViewToDatabase(productId, metadata);
        console.log('[ViewedProducts] addAnonymousViewToDatabase result:', success);
      }
    }, 5000); // 5 second debounce

    this.viewQueue.set(productId, timeout);
    console.log('[ViewedProducts] Timeout set, waiting 5 seconds...');
  }

  public async getViewedProducts(options?: {
    limit?: number;
    offset?: number;
    includeProductDetails?: boolean;
    timeframe?: '7d' | '30d' | '90d' | 'all';
  }): Promise<ViewedProductRecord[]> {
    const { limit = 20, offset = 0, includeProductDetails = true, timeframe = '90d' } = options || {};

    // Always check current auth status
    const currentAuthStatus = this.checkAuthStatus();
    this.isAuthenticated = currentAuthStatus;

    if (this.isAuthenticated) {
      // User is authenticated, fetch from database
      try {
        const response = await axios.get(`${API_URL}/viewed-products`, {
          params: { limit, offset, includeProductDetails, timeframe },
          headers: this.getAuthHeaders()
        });

        if ((response.data as any)?.success) {
          return (response.data as any).data.views || [];
        }
      } catch (error) {
        console.error('Error fetching viewed products from database:', error);
      }
      return [];
    } else {
      // User is guest, get from localStorage
      const localData = this.getLocalStorageData();
      
      // Filter by timeframe
      let filteredData = localData;
      if (timeframe !== 'all') {
        const timeframes = {
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
          '90d': 90 * 24 * 60 * 60 * 1000,
        };
        
        const cutoffTime = Date.now() - timeframes[timeframe];
        filteredData = localData.filter(item => 
          new Date(item.viewedAt).getTime() > cutoffTime
        );
      }

      // Apply pagination
      const paginatedData = filteredData.slice(offset, offset + limit);

      // Convert to ViewedProductRecord format
      const records: ViewedProductRecord[] = paginatedData.map((item, index) => ({
        viewId: `local_${offset + index}`,
        productId: item.productId,
        viewedAt: item.viewedAt,
        metadata: item.metadata
      }));

      // Include product details if requested
      if (includeProductDetails) {
        // Import product service dynamically to avoid circular dependencies
        const { getProductById } = await import('./product');
        
        await Promise.all(
          records.map(async (record) => {
            try {
              const product = await getProductById(record.productId);
              record.product = product || undefined;
            } catch (error) {
              console.error(`Error fetching product details for ${record.productId}:`, error);
            }
          })
        );
      }

      return records;
    }
  }

  public async clearViewedProducts(olderThan?: Date): Promise<boolean> {
    // Always check current auth status
    const currentAuthStatus = this.checkAuthStatus();
    this.isAuthenticated = currentAuthStatus;
    
    if (this.isAuthenticated) {
      // User is authenticated, clear from database
      try {
        const params = olderThan ? { olderThan: olderThan.toISOString() } : {};
        const response = await axios.delete(`${API_URL}/viewed-products`, {
          params,
          headers: this.getAuthHeaders()
        });

        return (response.data as any)?.success || false;
      } catch (error) {
        console.error('Error clearing viewed products from database:', error);
        return false;
      }
    } else {
      // User is guest, clear localStorage
      if (olderThan) {
        const localData = this.getLocalStorageData();
        const filteredData = localData.filter(item => 
          new Date(item.viewedAt) >= olderThan
        );
        this.setLocalStorageData(filteredData);
      } else {
        this.clearLocalStorage();
      }
      return true;
    }
  }

  public async removeViewedProduct(productId: string): Promise<boolean> {
    // Always check current auth status
    const currentAuthStatus = this.checkAuthStatus();
    this.isAuthenticated = currentAuthStatus;
    
    if (this.isAuthenticated) {
      // For authenticated users, we need to find the viewId first
      try {
        const records = await this.getViewedProducts({ includeProductDetails: false });
        const record = records.find(r => r.productId === productId);
        
        if (record) {
          const response = await axios.delete(`${API_URL}/viewed-products/${record.viewId}`, {
            headers: this.getAuthHeaders()
          });
          return (response.data as any)?.success || false;
        }
        return false;
      } catch (error) {
        console.error('Error removing viewed product from database:', error);
        return false;
      }
    } else {
      // User is guest, remove from localStorage
      const localData = this.getLocalStorageData();
      const filteredData = localData.filter(item => item.productId !== productId);
      this.setLocalStorageData(filteredData);
      return true;
    }
  }

  public async migrateLocalStorageToDatabase(): Promise<{ successful: number; failed: number }> {
    // Prevent duplicate migrations
    const now = Date.now();
    if (now - this.lastMigrationTime < 10000) { // 10 second debounce
      console.log('⚠️ Migration skipped - too recent (within 10 seconds)');
      return { successful: 0, failed: 0 };
    }
    
    if (this.isMigrationInProgress) {
      console.log('⚠️ Migration skipped - already in progress');
      return { successful: 0, failed: 0 };
    }

    this.isMigrationInProgress = true;
    this.lastMigrationTime = now;
    
    // Always check current auth status
    const currentAuthStatus = this.checkAuthStatus();
    this.isAuthenticated = currentAuthStatus;
    
    if (!this.isAuthenticated) {
      this.isMigrationInProgress = false;
      return { successful: 0, failed: 0 };
    }

    const localData = this.getLocalStorageData();
    
    if (localData.length === 0) {
      this.isMigrationInProgress = false;
      return { successful: 0, failed: 0 };
    }

    console.log(`Migrating ${localData.length} viewed products to database...`);

    try {
      // Migrate data to database
      const result = await this.bulkAddToDatabase(localData);

      // Clear localStorage after successful migration
      if (result.successful > 0) {
        this.clearLocalStorage();
        console.log(`Successfully migrated ${result.successful} viewed products to database`);
      }

      if (result.failed > 0) {
        console.warn(`Failed to migrate ${result.failed} viewed products`);
      }

      return result;
    } finally {
      // Always reset the migration flag
      this.isMigrationInProgress = false;
    }
  }

  // Analytics methods (for future use)
  public async getViewingAnalytics(timeframe: '7d' | '30d' | '90d' = '7d', type: 'popular' | 'trends' = 'popular') {
    // Always check current auth status
    const currentAuthStatus = this.checkAuthStatus();
    this.isAuthenticated = currentAuthStatus;
    
    if (!this.isAuthenticated) return null;

    try {
      const response = await axios.get(`${API_URL}/viewed-products/analytics`, {
        params: { timeframe, type },
        headers: this.getAuthHeaders()
      });

      return (response.data as any)?.success ? (response.data as any).data : null;
    } catch (error) {
      console.error('Error fetching viewing analytics:', error);
      return null;
    }
  }

  // Cleanup method
  public cleanup(): void {
    // Clear all pending timeouts
    this.viewQueue.forEach(timeout => clearTimeout(timeout));
    this.viewQueue.clear();
  }
}

// Create singleton instance
const viewedProductsService = new ViewedProductsService();

// Export service instance and convenience methods
export default viewedProductsService;

export const addViewedProduct = (productId: string, metadata?: ViewMetadata) => 
  viewedProductsService.addViewedProduct(productId, metadata);

export const getViewedProducts = (options?: Parameters<typeof viewedProductsService.getViewedProducts>[0]) => 
  viewedProductsService.getViewedProducts(options);

export const clearViewedProducts = (olderThan?: Date) => 
  viewedProductsService.clearViewedProducts(olderThan);

export const removeViewedProduct = (productId: string) => 
  viewedProductsService.removeViewedProduct(productId);

export const updateAuthStatus = (isAuthenticated?: boolean) => 
  viewedProductsService.updateAuthStatus(isAuthenticated);

export const migrateLocalStorageToDatabase = () => 
  viewedProductsService.migrateLocalStorageToDatabase();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    viewedProductsService.cleanup();
  });
}