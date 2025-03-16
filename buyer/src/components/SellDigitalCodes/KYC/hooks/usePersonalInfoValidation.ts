import { useState, useEffect } from 'react';
import PostalCodes from 'postal-codes-js';
import { CountryOption } from '../types';

interface ValidationHookProps {
  formData: {
    dateOfBirth: Date | null;
    postalCode?: string;
    country?: string;
    city?: string;
  };
  countries: CountryOption[];
}

export const usePersonalInfoValidation = ({ formData, countries }: ValidationHookProps) => {
  const [age, setAge] = useState<number | null>(null);
  const [postalCodeError, setPostalCodeError] = useState<string>("");
  const [cityError, setCityError] = useState<string>("");

  const validatePostalCode = (code: string, country: string) => {
    if (!code || !country) return;

    const countryObj = countries.find(c => c.label === country);
    if (!countryObj) return;

    const result = PostalCodes.validate(countryObj.value, code);
    if (result !== true) {
      setPostalCodeError(`Invalid postal code for ${country}`);
    } else {
      setPostalCodeError("");
    }
  };

  const validateCity = (city: string) => {
    const cityRegex = /^[a-zA-Z\s-]+$/;
    if (!city) {
      setCityError("");
      return;
    }
    if (!cityRegex.test(city)) {
      setCityError("City name should only contain letters, spaces, and hyphens");
    } else {
      setCityError("");
    }
  };

  useEffect(() => {
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setAge(age);
    } else {
      setAge(null);
    }
  }, [formData.dateOfBirth]);

  return {
    age,
    postalCodeError,
    cityError,
    validatePostalCode,
    validateCity,
  };
}; 