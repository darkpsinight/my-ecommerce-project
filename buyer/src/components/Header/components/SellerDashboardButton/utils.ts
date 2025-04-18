import { DashboardSettings } from './types';

// Constants
export const STORAGE_KEY = "settings";

// LocalStorage Helpers
export const getStoredSettings = (): DashboardSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          popoverDismissed: false,
          dismissedAt: 0,
          lastInteraction: 0,
        };
  } catch (error) {
    console.error("Error reading dashboard settings:", error);
    return {
      popoverDismissed: false,
      dismissedAt: 0,
      lastInteraction: 0,
    };
  }
};

export const updateStoredSettings = (updates: Partial<DashboardSettings>) => {
  try {
    const currentSettings = getStoredSettings();
    const newSettings = { ...currentSettings, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    return newSettings;
  } catch (error) {
    console.error("Error saving dashboard settings:", error);
    return null;
  }
};
