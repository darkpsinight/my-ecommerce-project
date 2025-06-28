/**
 * Time utility functions for formatting dates and relative time
 */

/**
 * Formats a date as relative time (e.g., "2 hours ago", "3 days ago")
 * @param date - The date to format (string, Date, or timestamp)
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: string | Date | number): string => {
  try {
    const now = new Date();
    const targetDate = new Date(date);
    
    // Check if the date is valid
    if (isNaN(targetDate.getTime())) {
      return 'Unknown';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    
    // Handle future dates
    if (diffInSeconds < 0) {
      return 'Just now';
    }
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    // Less than a month (30 days)
    if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    // Less than a year
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // More than a year
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown';
  }
};

/**
 * Formats a date as a human-readable string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string => {
  try {
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      return 'Invalid Date';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(targetDate);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a date as a short date string (e.g., "Mar 15, 2024")
 * @param date - The date to format
 * @returns Short formatted date string
 */
export const formatShortDate = (date: string | Date | number): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats a date as a time string (e.g., "2:30 PM")
 * @param date - The date to format
 * @returns Formatted time string
 */
export const formatTime = (date: string | Date | number): string => {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Checks if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export const isToday = (date: string | Date | number): boolean => {
  try {
    const today = new Date();
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      return false;
    }
    
    return (
      today.getFullYear() === targetDate.getFullYear() &&
      today.getMonth() === targetDate.getMonth() &&
      today.getDate() === targetDate.getDate()
    );
  } catch {
    return false;
  }
};

/**
 * Checks if a date is yesterday
 * @param date - The date to check
 * @returns True if the date is yesterday
 */
export const isYesterday = (date: string | Date | number): boolean => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      return false;
    }
    
    return (
      yesterday.getFullYear() === targetDate.getFullYear() &&
      yesterday.getMonth() === targetDate.getMonth() &&
      yesterday.getDate() === targetDate.getDate()
    );
  } catch {
    return false;
  }
};

/**
 * Gets the time difference in a human-readable format
 * @param startDate - Start date
 * @param endDate - End date (default: now)
 * @returns Human-readable time difference
 */
export const getTimeDifference = (
  startDate: string | Date | number,
  endDate: string | Date | number = new Date()
): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Unknown duration';
    }
    
    const diffInMs = Math.abs(end.getTime() - start.getTime());
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`;
    }
    
    if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`;
    }
    
    if (diffInMinutes > 0) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'}`;
    
  } catch (error) {
    console.error('Error calculating time difference:', error);
    return 'Unknown duration';
  }
};

/**
 * Formats duration in milliseconds to human-readable format
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (durationMs: number): string => {
  try {
    if (durationMs < 0 || isNaN(durationMs)) {
      return '0 seconds';
    }
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    
    if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    
    if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    
  } catch (error) {
    console.error('Error formatting duration:', error);
    return '0 seconds';
  }
};