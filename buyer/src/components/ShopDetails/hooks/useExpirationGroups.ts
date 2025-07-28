import { useState, useEffect } from 'react';
import { getProductExpirationGroups, type ExpirationGroup } from '@/services/product';

export const useExpirationGroups = (productId: string | null) => {
  const [expirationGroups, setExpirationGroups] = useState<ExpirationGroup[]>([]);
  const [selectedExpirationGroups, setSelectedExpirationGroups] = useState<
    Array<{ type: "never_expires" | "expires"; count: number; date?: string }>
  >([]);
  const [expirationGroupsLoading, setExpirationGroupsLoading] = useState(false);
  const [useExpirationGroups, setUseExpirationGroups] = useState(false);

  // Fetch expiration groups when product is loaded
  useEffect(() => {
    const fetchExpirationGroups = async () => {
      if (!productId) return;
      
      try {
        setExpirationGroupsLoading(true);
        const groups = await getProductExpirationGroups(productId);
        
        if (groups && groups.length > 0) {
          setExpirationGroups(groups);
          setUseExpirationGroups(groups.length > 1); // Only use groups if multiple exist
        } else {
          setExpirationGroups([]);
          setUseExpirationGroups(false);
        }
      } catch (error) {
        console.error("Error fetching expiration groups:", error);
        setExpirationGroups([]);
        setUseExpirationGroups(false);
      } finally {
        setExpirationGroupsLoading(false);
      }
    };

    fetchExpirationGroups();
  }, [productId]);

  return {
    expirationGroups,
    selectedExpirationGroups,
    setSelectedExpirationGroups,
    expirationGroupsLoading,
    useExpirationGroups
  };
};