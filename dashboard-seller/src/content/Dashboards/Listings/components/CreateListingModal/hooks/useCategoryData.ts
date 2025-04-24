import { useState, useEffect } from 'react';
import { getCategories } from 'src/services/api/listings';
import { Pattern } from 'src/services/api/validation';
import { Category } from '../types';

/**
 * Hook to manage category and platform data
 */
export const useCategoryData = (open: boolean, setError: (error: string | null) => void) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [patternLoading, setPatternLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Default regions
  const regions = [
    'Global',
    'North America',
    'Europe',
    'Asia',
    'Oceania',
    'South America',
    'Africa',
    'Other'
  ];

  // Fetch categories when component mounts or when modal opens
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setLoading(true);
        const response = await getCategories();
        if (response && response.success && response.data) {
          setCategories(response.data);
        } else {
          setError(
            'Failed to load categories: ' +
              (response.message || 'Unknown error')
          );
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCategoriesData();
    }
  }, [open, setError]);

  return {
    categories,
    availablePlatforms,
    setAvailablePlatforms,
    selectedCategory,
    setSelectedCategory,
    patterns,
    setPatterns,
    selectedPattern,
    setSelectedPattern,
    patternLoading,
    setPatternLoading,
    validationError,
    setValidationError,
    regions,
    loading
  };
};
