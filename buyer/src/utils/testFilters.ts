/**
 * Test utility to verify filter API endpoints
 */

import { getFilterOptions, getPriceRange } from '@/services/filters';

export const testFilterEndpoints = async () => {
  console.log('🧪 Testing Filter API Endpoints...');
  
  try {
    // Test filter options endpoint
    console.log('📡 Testing /filter-options endpoint...');
    const filterOptions = await getFilterOptions();
    
    if (filterOptions) {
      console.log('✅ Filter options loaded successfully:', {
        categories: filterOptions.categories.length,
        platforms: filterOptions.platforms.length,
        regions: filterOptions.regions.length,
        priceRange: filterOptions.priceRange
      });
    } else {
      console.error('❌ Failed to load filter options');
    }
    
    // Test price range endpoint
    console.log('📡 Testing /price-range endpoint...');
    const priceRange = await getPriceRange();
    
    if (priceRange) {
      console.log('✅ Price range loaded successfully:', priceRange);
    } else {
      console.error('❌ Failed to load price range');
    }
    
    // Test filtered price range
    console.log('📡 Testing filtered price range...');
    const filteredPriceRange = await getPriceRange({
      categoryId: filterOptions?.categories[0]?.value
    });
    
    if (filteredPriceRange) {
      console.log('✅ Filtered price range loaded successfully:', filteredPriceRange);
    } else {
      console.error('❌ Failed to load filtered price range');
    }
    
    console.log('🎉 Filter API testing completed!');
    
  } catch (error) {
    console.error('💥 Error testing filter endpoints:', error);
  }
};

// Test function for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testFilters = testFilterEndpoints;
  console.log('🔧 Test function available: window.testFilters()');
}