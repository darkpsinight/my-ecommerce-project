import { useState, useEffect } from 'react';
import { getCategories } from 'src/services/api/listings';
import { Pattern } from 'src/services/api/validation';
import { Category } from '../types';

/**
 * Hook to manage category and platform data
 */
export const useCategoryData = (
  open: boolean, 
  setError: (error: string | null) => void,
  initialCategories: Category[] = []
) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [patternLoading, setPatternLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState<boolean>(initialCategories.length > 0);
  
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

  // Fetch categories only when the modal is actually opened
  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setLoading(true);
        const response = await getCategories();
        if (response && response.success && response.data) {
          setCategories(response.data);
          setCategoriesLoaded(true);
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

    // Only fetch categories if the modal is open and we haven't loaded them yet
    if (open && !categoriesLoaded) {
      fetchCategoriesData();
    }
  }, [open, setError, categoriesLoaded]);

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
