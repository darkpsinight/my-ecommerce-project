/**
 * Test utility to verify token refresh fix
 * Run this in browser console after login to test the fix
 */

// @ts-ignore
window.testRefreshFix = () => {
  console.log('🧪 Testing Token Refresh Fix...');
  
  // Import the refresh manager
  import('../services/authRefreshManager').then(({ getRefreshDebugInfo, authRefreshManager }) => {
    console.log('📊 Current Refresh State:');
    console.log(getRefreshDebugInfo());
    
    // Test multiple rapid refresh attempts (should be deduplicated)
    console.log('🔄 Testing rapid refresh deduplication...');
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        authRefreshManager.refreshToken({ source: `test-${i}`, force: false })
      );
    }
    
    Promise.all(promises).then(results => {
      console.log('✅ Rapid refresh test results:', results);
      console.log('📊 Final state:', getRefreshDebugInfo());
      
      // Count actual refresh calls that succeeded
      const successCount = results.filter(r => r).length;
      if (successCount <= 1) {
        console.log('✅ PASS: Deduplication working - only', successCount, 'refresh succeeded');
      } else {
        console.log('❌ FAIL: Multiple refreshes succeeded:', successCount);
      }
    });
  });
};

// @ts-ignore
window.getRefreshStats = () => {
  import('../services/authRefreshManager').then(({ getRefreshDebugInfo }) => {
    console.table(getRefreshDebugInfo());
  });
};

console.log('🧪 Refresh fix test utilities loaded!');
console.log('Run window.testRefreshFix() to test deduplication');
console.log('Run window.getRefreshStats() to see current stats');

export {};