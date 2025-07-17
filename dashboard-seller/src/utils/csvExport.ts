/**
 * Utility functions for exporting data to CSV format
 */

import { Listing, ListingCode } from '../content/Dashboards/Listings/types';

/**
 * Convert an array of listings to CSV format
 * @param listings - Array of listings to convert
 * @returns CSV string
 */
export const listingsToCSV = (listings: Listing[]): string => {
  // Define the headers for the CSV file
  const headers = [
    'Title',
    'Platform',
    'Region',
    'Price',
    'Original Price',
    'Status',
    'Category',
    'Total Codes',
    'Active Codes',
    'Auto Delivery',
    'Created At',
    'Updated At'
  ];

  // Create the CSV header row
  let csv = headers.join(',') + '\n';

  // Process each listing
  listings.forEach(listing => {
    // Format status for display (active -> On Sale)
    const statusDisplay = listing.status === 'active'
      ? 'On Sale'
      : listing.status.charAt(0).toUpperCase() + listing.status.slice(1);

    // Get category name
    const categoryName = typeof listing.categoryId === 'object' && listing.categoryId?.name
      ? listing.categoryId.name
      : listing.categoryName || '';

    // Format dates
    const createdAt = listing.createdAt
      ? new Date(listing.createdAt).toISOString().split('T')[0]
      : '';
    const updatedAt = listing.updatedAt
      ? new Date(listing.updatedAt).toISOString().split('T')[0]
      : '';

    // Count codes
    const totalCodes = listing.codes?.length || listing.quantityOfAllCodes || 0;
    const activeCodes = listing.quantityOfActiveCodes ||
      (listing.codes?.filter(code => code.soldStatus === 'available').length || 0);

    // Escape fields that might contain commas
    const escapeCsvField = (field: string) => {
      if (field && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    // Create a row for this listing
    const row = [
      escapeCsvField(listing.title),
      escapeCsvField(listing.platform),
      escapeCsvField(listing.region),
      listing.price.toString(),
      (listing.originalPrice || '').toString(),
      statusDisplay,
      escapeCsvField(categoryName),
      totalCodes.toString(),
      activeCodes.toString(),
      listing.autoDelivery ? 'Yes' : 'No',
      createdAt,
      updatedAt
    ];

    // Add the row to the CSV
    csv += row.join(',') + '\n';
  });

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
 * Generate a filename for the CSV export with the current date
 * @returns Formatted filename
 */
export const generateCSVFilename = (): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `listings-export-${date}.csv`;
};

/**
 * Export selected listings to CSV and trigger download
 * @param listings - All listings
 * @param selectedIds - IDs of selected listings to export
 */
export const exportListingsToCSV = (listings: Listing[], selectedIds: string[]): void => {
  // Filter listings to only include selected ones
  const selectedListings = listings.filter(listing =>
    selectedIds.includes(listing.externalId)
  );

  // Convert to CSV
  const csvData = listingsToCSV(selectedListings);

  // Generate filename
  const filename = generateCSVFilename();

  // Trigger download
  downloadCSV(csvData, filename);
};
