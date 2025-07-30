/**
 * Utility functions for exporting analytics data to CSV format
 */

import { AnalyticsOverviewData, RevenueChartData } from '../services/api/analytics';

/**
 * Convert analytics overview data to CSV format optimized for spreadsheet viewing
 * @param analyticsData - Analytics overview data
 * @param chartData - Revenue chart data
 * @param timeRange - Time range for the report
 * @returns CSV string
 */
export const analyticsToCSV = (
  analyticsData: AnalyticsOverviewData,
  chartData: RevenueChartData | null,
  timeRange: string
): string => {
  let csv = '';

  // Report Header - Single row format
  csv += `Analytics Report,${timeRange.toUpperCase()},Generated: ${new Date().toISOString().split('T')[0]}\n\n`;

  // Revenue Summary - Clean table format
  csv += 'REVENUE SUMMARY\n';
  csv += 'Metric,Value,Currency\n';
  csv += `Total Revenue,${(analyticsData.revenue.totalRevenue || 0).toFixed(2)},USD\n`;
  csv += `Order Count,${analyticsData.revenue.orderCount || 0},Orders\n`;
  csv += `Average Order Value,${(analyticsData.revenue.avgOrderValue || 0).toFixed(2)},USD\n\n`;

  // Revenue by Platform
  if (analyticsData.revenue.revenueByPlatform?.length > 0) {
    csv += 'REVENUE BY PLATFORM\n';
    csv += 'Platform,Revenue (USD),Orders,Percentage\n';
    const totalRevenue = analyticsData.revenue.totalRevenue || 1;
    analyticsData.revenue.revenueByPlatform.forEach(platform => {
      const percentage = ((platform.revenue / totalRevenue) * 100).toFixed(1);
      csv += `${platform.platform},${platform.revenue.toFixed(2)},${platform.orders},${percentage}%\n`;
    });
    csv += '\n';
  }

  // Best Sellers - Improved formatting
  if (analyticsData.sales?.bestSellers?.length > 0) {
    csv += 'BEST SELLING PRODUCTS\n';
    csv += 'Rank,Product Title,Platform,Units Sold,Revenue (USD),Avg Price\n';
    analyticsData.sales.bestSellers.forEach((product, index) => {
      const avgPrice = product.totalSold > 0 ? (product.revenue / product.totalSold).toFixed(2) : '0.00';
      const cleanTitle = product.title.replace(/"/g, '""'); // Proper CSV escaping
      csv += `${index + 1},"${cleanTitle}",${product.platform},${product.totalSold},${product.revenue.toFixed(2)},${avgPrice}\n`;
    });
    csv += '\n';
  }

  // Sales by Region
  if (analyticsData.sales?.salesByRegion?.length > 0) {
    csv += 'SALES BY REGION\n';
    csv += 'Region,Units Sold,Revenue (USD),Avg Order Value\n';
    analyticsData.sales.salesByRegion.forEach(region => {
      const avgOrderValue = region.sales > 0 ? (region.revenue / region.sales).toFixed(2) : '0.00';
      csv += `${region.region},${region.sales},${region.revenue.toFixed(2)},${avgOrderValue}\n`;
    });
    csv += '\n';
  }

  // Platform Distribution
  if (analyticsData.inventory?.platformDistribution?.length > 0) {
    csv += 'INVENTORY BY PLATFORM\n';
    csv += 'Platform,Active Listings,Total Codes,Avg Codes per Listing\n';
    analyticsData.inventory.platformDistribution.forEach(platform => {
      const avgCodes = platform.listings > 0 ? (platform.totalCodes / platform.listings).toFixed(1) : '0.0';
      csv += `${platform.platform},${platform.listings},${platform.totalCodes},${avgCodes}\n`;
    });
    csv += '\n';
  }

  // Inventory Stats
  if (analyticsData.inventory?.inventoryStats?.length > 0) {
    csv += 'INVENTORY STATUS BREAKDOWN\n';
    csv += 'Status,Listing Count,Total Codes,Active Codes,Utilization Rate\n';
    analyticsData.inventory.inventoryStats.forEach(stat => {
      const utilizationRate = stat.totalCodes > 0 ? ((stat.activeCodes / stat.totalCodes) * 100).toFixed(1) : '0.0';
      csv += `${stat.status},${stat.count},${stat.totalCodes},${stat.activeCodes},${utilizationRate}%\n`;
    });
    csv += '\n';
  }

  // Engagement Metrics
  if (analyticsData.engagement) {
    csv += 'ENGAGEMENT METRICS SUMMARY\n';
    csv += 'Metric,Value,Notes\n';
    csv += `Total Views,${analyticsData.engagement.totalViews},All listing views\n`;
    csv += `Unique Viewers,${analyticsData.engagement.uniqueViewers},Distinct users who viewed listings\n`;
    csv += `Average Views per Listing,${analyticsData.engagement.avgViewsPerListing},Views divided by total listings\n`;
    csv += `Average Time on Page,${analyticsData.engagement.avgTimeOnPage}s,Average seconds spent viewing listings\n`;
    csv += `Total Time Spent,${analyticsData.engagement.totalTimeSpent}min,Total minutes across all views\n`;
    csv += `Views with Duration Data,${analyticsData.engagement.viewsWithDuration},Views that tracked time spent\n`;
    csv += `Conversion Rate,${analyticsData.engagement.conversionRate}%,Views to purchases ratio\n`;
    
    // Add CTR metrics if available
    if (analyticsData.engagement.ctr) {
      csv += `Total Impressions,${analyticsData.engagement.ctr.totalImpressions},Times listings were shown to users\n`;
      csv += `Total Clicks,${analyticsData.engagement.ctr.totalClicks},Times users clicked on listings\n`;
      csv += `Overall Click-Through Rate,${analyticsData.engagement.ctr.overallCTR}%,Percentage of impressions that resulted in clicks\n`;
    }
    
    csv += '\n';

    // Top Viewed Listings
    if (analyticsData.engagement.topViewedListings?.length > 0) {
      csv += 'MOST VIEWED LISTINGS\n';
      csv += 'Rank,Product Title,Platform,Total Views,Unique Viewers,Views per Viewer,Avg Time on Page (s),Total Time Spent (min)\n';
      analyticsData.engagement.topViewedListings.forEach((listing, index) => {
        const cleanTitle = listing.title.replace(/"/g, '""');
        const viewsPerViewer = listing.uniqueViewers > 0 ? (listing.viewCount / listing.uniqueViewers).toFixed(1) : '0.0';
        const avgTimeOnPage = listing.avgTimeOnPage || 0;
        const totalTimeSpent = listing.totalTimeSpent || 0;
        csv += `${index + 1},"${cleanTitle}",${listing.platform},${listing.viewCount},${listing.uniqueViewers},${viewsPerViewer},${avgTimeOnPage},${totalTimeSpent}\n`;
      });
      csv += '\n';
    }

    // Traffic Sources
    if (analyticsData.engagement.viewsBySource?.length > 0) {
      csv += 'TRAFFIC SOURCES\n';
      csv += 'Source,Views,Percentage\n';
      const totalViews = analyticsData.engagement.totalViews || 1;
      analyticsData.engagement.viewsBySource.forEach(source => {
        const percentage = ((source.count / totalViews) * 100).toFixed(1);
        csv += `${source.source.replace('_', ' ')},${source.count},${percentage}%\n`;
      });
      csv += '\n';
    }

    // CTR Analytics
    if (analyticsData.engagement.ctr) {
      // CTR by Source
      if (analyticsData.engagement.ctr.ctrBySource?.length > 0) {
        csv += 'CLICK-THROUGH RATE BY SOURCE\n';
        csv += 'Source,Impressions,Clicks,CTR (%),Performance\n';
        analyticsData.engagement.ctr.ctrBySource.forEach(source => {
          const performance = source.clickThroughRate > 5 ? 'Excellent' : 
                            source.clickThroughRate > 2 ? 'Good' : 
                            source.clickThroughRate > 1 ? 'Average' : 'Needs Improvement';
          csv += `${source.source.replace('_', ' ')},${source.totalImpressions},${source.totalClicks},${source.clickThroughRate},${performance}\n`;
        });
        csv += '\n';
      }

      // Top CTR Listings
      if (analyticsData.engagement.ctr.topCTRListings?.length > 0) {
        csv += 'HIGHEST CLICK-THROUGH RATE LISTINGS\n';
        csv += 'Rank,Product Title,Platform,Impressions,Clicks,CTR (%),Avg Click Delay (s),Performance\n';
        analyticsData.engagement.ctr.topCTRListings.forEach((listing, index) => {
          const cleanTitle = listing.title.replace(/"/g, '""');
          const avgClickDelay = listing.avgClickDelay ? listing.avgClickDelay.toFixed(1) : 'N/A';
          const performance = listing.clickThroughRate > 5 ? 'Excellent' : 
                            listing.clickThroughRate > 2 ? 'Good' : 
                            listing.clickThroughRate > 1 ? 'Average' : 'Needs Improvement';
          csv += `${index + 1},"${cleanTitle}",${listing.platform},${listing.totalImpressions},${listing.totalClicks},${listing.clickThroughRate},${avgClickDelay},${performance}\n`;
        });
        csv += '\n';
      }

      // Position Analysis
      if (analyticsData.engagement.ctr.positionAnalysis?.length > 0) {
        csv += 'CLICK-THROUGH RATE BY POSITION\n';
        csv += 'Position,Impressions,Clicks,CTR (%),Avg Click Delay (s),Notes\n';
        analyticsData.engagement.ctr.positionAnalysis.forEach(position => {
          const avgClickDelay = position.avgClickDelay ? position.avgClickDelay.toFixed(1) : 'N/A';
          const notes = position.position <= 3 ? 'Top positions' : 
                       position.position <= 10 ? 'Above fold' : 'Below fold';
          csv += `${position.position},${position.totalImpressions},${position.totalClicks},${position.clickThroughRate},${avgClickDelay},${notes}\n`;
        });
        csv += '\n';
      }
    }
  }

  // Wishlist Analytics
  if (analyticsData.wishlist) {
    csv += 'WISHLIST ANALYTICS SUMMARY\n';
    csv += 'Metric,Value,Notes\n';
    csv += `Total Wishlist Additions,${analyticsData.wishlist.totalWishlistAdditions},Items added to wishlists\n`;
    csv += `Unique Wishlisters,${analyticsData.wishlist.uniqueWishlisters},Distinct users who wishlisted items\n`;
    csv += `Wishlist Conversion Rate,${analyticsData.wishlist.wishlistConversionRate}%,Wishlist to purchase conversion\n`;
    csv += `Wishlist Abandonment Rate,${analyticsData.wishlist.wishlistAbandonmentRate}%,Items removed from wishlists\n`;
    csv += '\n';

    // Most Wishlisted Products
    if (analyticsData.wishlist.mostWishlistedProducts?.length > 0) {
      csv += 'MOST WISHLISTED PRODUCTS\n';
      csv += 'Rank,Product Title,Platform,Wishlist Count,Market Interest\n';
      analyticsData.wishlist.mostWishlistedProducts.forEach((product, index) => {
        const cleanTitle = product.title.replace(/"/g, '""');
        const interestLevel = product.wishlistCount > 10 ? 'High' : product.wishlistCount > 5 ? 'Medium' : 'Low';
        csv += `${index + 1},"${cleanTitle}",${product.platform},${product.wishlistCount},${interestLevel}\n`;
      });
      csv += '\n';
    }

    // Daily Wishlist Activity
    if (analyticsData.wishlist.dailyWishlistActivity?.length > 0) {
      csv += 'DAILY WISHLIST ACTIVITY\n';
      csv += 'Date,Additions,Removals,Net Change,Day of Week\n';
      analyticsData.wishlist.dailyWishlistActivity.forEach(activity => {
        const date = `${activity.date.year}-${String(activity.date.month).padStart(2, '0')}-${String(activity.date.day).padStart(2, '0')}`;
        const netChange = activity.additions - activity.removals;
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        csv += `${date},${activity.additions},${activity.removals},${netChange >= 0 ? '+' : ''}${netChange},${dayOfWeek}\n`;
      });
      csv += '\n';
    }
  }

  // Customer Insights
  if (analyticsData.customers) {
    csv += 'CUSTOMER INSIGHTS SUMMARY\n';
    csv += 'Metric,Value,Notes\n';
    csv += `Unique Customers,${analyticsData.customers.uniqueCustomerCount},Total unique buyers in time period\n`;
    csv += `Repeat Purchase Rate,${analyticsData.customers.repeatPurchaseRate || 0}%,Percentage of customers who made multiple purchases\n`;
    csv += `Average Time Between Purchases,${analyticsData.customers.avgTimeBetweenPurchases || 0} days,Average days between repeat purchases\n`;
    csv += `Customer Lifetime Value,${(analyticsData.customers.avgCustomerLifetimeValue || 0).toFixed(2)} USD,Estimated CLV per customer\n`;
    csv += `Customer Churn Rate,${analyticsData.customers.churnRate || 0}%,Percentage of customers who haven't purchased in 90+ days\n`;
    csv += `Average Order Value,${(analyticsData.customers.avgOrderValue || 0).toFixed(2)} USD,Average amount spent per order\n`;
    csv += `Average Order Frequency,${(analyticsData.customers.avgOrderFrequency || 0).toFixed(1)},Average orders per customer\n`;
    
    if (analyticsData.customers.customerSegmentation) {
      csv += `New Customers,${analyticsData.customers.customerSegmentation.newCustomers},Customers with 1 order\n`;
      csv += `Repeat Customers,${analyticsData.customers.customerSegmentation.repeatCustomers},Customers with 2-5 orders\n`;
      csv += `Loyal Customers,${analyticsData.customers.customerSegmentation.loyalCustomers},Customers with 6+ orders\n`;
    }
    
    if (analyticsData.customers.topCustomers?.length > 0) {
      const avgSpentPerCustomer = analyticsData.customers.topCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / analyticsData.customers.topCustomers.length;
      csv += `Average Spent (Top Customers),${avgSpentPerCustomer.toFixed(2)} USD,Average spending of top 10 customers\n`;
    }
    csv += '\n';

    if (analyticsData.customers.topCustomers?.length > 0) {
      csv += 'TOP CUSTOMERS DETAIL\n';
      csv += 'Rank,Customer ID,Total Orders,Total Spent (USD),Avg Order Value,First Order Date,Last Order Date,Customer Lifetime (Days)\n';
      analyticsData.customers.topCustomers.forEach((customer, index) => {
        const avgOrderValue = customer.orderCount > 0 ? (customer.totalSpent / customer.orderCount).toFixed(2) : '0.00';
        const firstOrderDate = new Date(customer.firstOrder).toISOString().split('T')[0];
        const lastOrderDate = new Date(customer.lastOrder).toISOString().split('T')[0];
        const lifetimeDays = Math.ceil((new Date(customer.lastOrder).getTime() - new Date(customer.firstOrder).getTime()) / (1000 * 60 * 60 * 24));
        csv += `${index + 1},${customer.customerId},${customer.orderCount},${customer.totalSpent.toFixed(2)},${avgOrderValue},${firstOrderDate},${lastOrderDate},${lifetimeDays}\n`;
      });
      csv += '\n';
    }
  }

  // Daily Revenue Trend (if chart data available)
  if (chartData?.chartData?.length > 0) {
    csv += 'DAILY REVENUE TREND\n';
    csv += 'Date,Revenue (USD),Orders,Avg Order Value,Day of Week\n';
    chartData.chartData.forEach(dataPoint => {
      const date = `${dataPoint._id.year}-${String(dataPoint._id.month).padStart(2, '0')}-${String(dataPoint._id.day || 1).padStart(2, '0')}`;
      const avgOrderValue = dataPoint.orders > 0 ? (dataPoint.revenue / dataPoint.orders).toFixed(2) : '0.00';
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      csv += `${date},${dataPoint.revenue.toFixed(2)},${dataPoint.orders},${avgOrderValue},${dayOfWeek}\n`;
    });
  }

  return csv;
};

/**
 * Download data as a CSV file
 * @param data - CSV string data
 * @param filename - Name of the file to download
 */
export const downloadCSV = (data: string, filename: string): void => {
  // Create a blob with the CSV data
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });

  // Create a URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a link element
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  // Add the link to the DOM
  document.body.appendChild(link);

  // Click the link to trigger the download
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate a filename for the analytics CSV export with the current date
 * @param timeRange - Time range for the report
 * @returns Formatted filename
 */
export const generateAnalyticsCSVFilename = (timeRange: string): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `analytics-report-${timeRange}-${date}.csv`;
};

/**
 * Export analytics data to CSV and trigger download
 * @param analyticsData - Analytics overview data
 * @param chartData - Revenue chart data
 * @param timeRange - Time range for the report
 */
export const exportAnalyticsToCSV = (
  analyticsData: AnalyticsOverviewData,
  chartData: RevenueChartData | null,
  timeRange: string
): void => {
  // Convert to CSV
  const csvData = analyticsToCSV(analyticsData, chartData, timeRange);

  // Generate filename
  const filename = generateAnalyticsCSVFilename(timeRange);

  // Trigger download
  downloadCSV(csvData, filename);
};