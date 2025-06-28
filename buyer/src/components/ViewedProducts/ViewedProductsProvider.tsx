import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthAwareViewedProducts } from '@/hooks/useViewedProducts';
import { useAuth } from '@/hooks/useAuth'; // Assuming this exists
import { toast } from 'react-hot-toast'; // Assuming you're using react-hot-toast

interface ViewedProductsContextType {
  migrationStatus: 'idle' | 'migrating' | 'completed' | 'error';
  migrationResult: { successful: number; failed: number } | null;
}

const ViewedProductsContext = createContext<ViewedProductsContextType | undefined>(undefined);

interface ViewedProductsProviderProps {
  children: ReactNode;
}

export const ViewedProductsProvider: React.FC<ViewedProductsProviderProps> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { migrationStatus, migrationResult, handleAuthChange } = useAuthAwareViewedProducts();

  // Handle authentication changes
  useEffect(() => {
    if (!authLoading) {
      handleAuthChange(isAuthenticated);
    }
  }, [isAuthenticated, authLoading, handleAuthChange]);

  // Show migration notifications
  useEffect(() => {
    if (migrationStatus === 'completed' && migrationResult) {
      if (migrationResult.successful > 0) {
        toast.success(
          `Successfully synced ${migrationResult.successful} recently viewed products to your account!`,
          {
            duration: 5000,
            position: 'bottom-right',
            icon: '✅'
          }
        );
      }
      
      if (migrationResult.failed > 0) {
        toast.error(
          `Failed to sync ${migrationResult.failed} products. Please try refreshing the page.`,
          {
            duration: 7000,
            position: 'bottom-right'
          }
        );
      }
    } else if (migrationStatus === 'error') {
      toast.error(
        'Failed to sync your recently viewed products. Your data is safe and will sync when you refresh.',
        {
          duration: 7000,
          position: 'bottom-right'
        }
      );
    }
  }, [migrationStatus, migrationResult]);

  const contextValue: ViewedProductsContextType = {
    migrationStatus,
    migrationResult
  };

  return (
    <ViewedProductsContext.Provider value={contextValue}>
      {children}
      {migrationStatus === 'migrating' && (
        <MigrationIndicator />
      )}
    </ViewedProductsContext.Provider>
  );
};

const MigrationIndicator: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <div>
        <p className="font-medium text-sm">Syncing viewed products...</p>
        <p className="text-xs opacity-90">Your viewing history is being saved to your account</p>
      </div>
    </div>
  );
};

export const useViewedProductsContext = () => {
  const context = useContext(ViewedProductsContext);
  if (context === undefined) {
    throw new Error('useViewedProductsContext must be used within a ViewedProductsProvider');
  }
  return context;
};