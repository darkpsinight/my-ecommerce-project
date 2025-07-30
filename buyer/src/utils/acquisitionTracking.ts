// Utility functions for tracking customer acquisition

export interface AcquisitionData {
  channel?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referralCode?: string;
}

// Extract UTM parameters from URL
export const extractUTMParameters = (): AcquisitionData => {
  if (typeof window === 'undefined') {
    return {};
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  const acquisitionData: AcquisitionData = {
    utmSource: urlParams.get('utm_source') || undefined,
    utmMedium: urlParams.get('utm_medium') || undefined,
    utmCampaign: urlParams.get('utm_campaign') || undefined,
    utmContent: urlParams.get('utm_content') || undefined,
    utmTerm: urlParams.get('utm_term') || undefined,
    referralCode: urlParams.get('ref') || urlParams.get('referral') || undefined,
  };

  // Determine channel based on UTM parameters
  if (acquisitionData.utmSource) {
    const source = acquisitionData.utmSource.toLowerCase();
    const medium = acquisitionData.utmMedium?.toLowerCase();

    if (source.includes('google') && medium === 'cpc') {
      acquisitionData.channel = 'google_ads';
    } else if (source.includes('facebook')) {
      acquisitionData.channel = 'facebook_ads';
    } else if (source.includes('instagram')) {
      acquisitionData.channel = 'instagram_ads';
    } else if (source.includes('twitter')) {
      acquisitionData.channel = 'twitter_ads';
    } else if (source.includes('linkedin')) {
      acquisitionData.channel = 'linkedin_ads';
    } else if (source.includes('youtube')) {
      acquisitionData.channel = 'youtube_ads';
    } else if (source.includes('tiktok')) {
      acquisitionData.channel = 'tiktok_ads';
    } else if (source.includes('reddit')) {
      acquisitionData.channel = 'reddit_ads';
    } else if (medium === 'email') {
      acquisitionData.channel = 'email_marketing';
    } else if (medium === 'referral' || acquisitionData.referralCode) {
      acquisitionData.channel = 'referral_program';
    } else if (medium === 'social') {
      acquisitionData.channel = 'influencer_marketing';
    } else if (medium === 'affiliate') {
      acquisitionData.channel = 'affiliate_marketing';
    } else {
      acquisitionData.channel = 'other';
    }
  } else if (acquisitionData.referralCode) {
    acquisitionData.channel = 'referral_program';
  } else {
    // Check referrer for organic traffic
    const referrer = document.referrer;
    if (referrer) {
      const referrerDomain = new URL(referrer).hostname.toLowerCase();
      if (referrerDomain.includes('google')) {
        acquisitionData.channel = 'organic';
        acquisitionData.utmSource = 'google';
        acquisitionData.utmMedium = 'organic';
      } else if (referrerDomain.includes('facebook')) {
        acquisitionData.channel = 'organic';
        acquisitionData.utmSource = 'facebook';
        acquisitionData.utmMedium = 'social';
      } else if (referrerDomain.includes('twitter')) {
        acquisitionData.channel = 'organic';
        acquisitionData.utmSource = 'twitter';
        acquisitionData.utmMedium = 'social';
      } else {
        acquisitionData.channel = 'organic';
        acquisitionData.utmSource = referrerDomain;
        acquisitionData.utmMedium = 'referral';
      }
    } else {
      acquisitionData.channel = 'direct';
    }
  }

  return acquisitionData;
};

// Store acquisition data in localStorage for later use
export const storeAcquisitionData = (data: AcquisitionData): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('acquisitionData', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to store acquisition data:', error);
  }
};

// Retrieve stored acquisition data
export const getStoredAcquisitionData = (): AcquisitionData | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem('acquisitionData');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve acquisition data:', error);
    return null;
  }
};

// Clear stored acquisition data (after successful signup)
export const clearAcquisitionData = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem('acquisitionData');
  } catch (error) {
    console.error('Failed to clear acquisition data:', error);
  }
};

// Initialize acquisition tracking on page load
export const initializeAcquisitionTracking = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  // Only extract and store if we don't already have data
  const existingData = getStoredAcquisitionData();
  if (!existingData) {
    const acquisitionData = extractUTMParameters();
    if (Object.keys(acquisitionData).length > 0) {
      storeAcquisitionData(acquisitionData);
    }
  }
};