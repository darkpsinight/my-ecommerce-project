import { StepProps } from "../types";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import countryList from "react-select-country-list";
import { useEffect, useState, useMemo } from "react";
import styles from "./PersonalInfoStep.module.css";
import PostalCodes from "postal-codes-js";

const PersonalInfoStep = ({ formData, handleInputChange, handleFileChange, handleDateChange }: StepProps) => {
  const [age, setAge] = useState<number | null>(null);
  const [postalCodeError, setPostalCodeError] = useState<string>("");
  const [cityError, setCityError] = useState<string>("");
  const countries = useMemo(() => countryList().getData(), []);

  // Handle postal code validation
  const validatePostalCode = (code: string, country: string) => {
    if (!code || !country) return;

    // Get country code (postal-codes-js uses ISO 3166-1 alpha-2 codes)
    const countryObj = countries.find(c => c.label === country);
    if (!countryObj) return;

    const result = PostalCodes.validate(countryObj.value, code);
    if (result !== true) {
      setPostalCodeError(`Invalid postal code for ${country}`);
    } else {
      setPostalCodeError("");
    }
  };

  // Handle city validation
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

  // Enhanced input handler for address fields
  const handleAddressInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleInputChange(e);

    if (name === "city") {
      validateCity(value);
    }
    if (name === "postalCode" && formData.country) {
      validatePostalCode(value, formData.country);
    }
  };

  // Enhanced country selection handler
  const handleCountrySelect = (selectedOption: any, action: { name: string }) => {
    if (selectedOption) {
      const event = {
        target: {
          name: action.name,
          value: selectedOption.label,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(event);

      // Revalidate postal code when country changes
      if (formData.postalCode) {
        validatePostalCode(formData.postalCode, selectedOption.label);
      }
    }
  };

  // Handle name input validation
  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = value.replace(/[^A-Za-z ]/gi, '');
    const event = {
      target: {
        name,
        value: sanitizedValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
  };

  // Calculate age whenever date of birth changes
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

  const renderAgeVerification = () => {
    if (age === null) return null;

    if (age >= 18) {
      return (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-3 flex items-center gap-1.5 bg-green-light-6 px-2 py-1 rounded-md">
          <svg 
            className="w-4 h-4 text-green" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="text-sm font-semibold text-green">18+ verified</span>
        </div>
      );
    }

    return (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-3 flex items-center gap-1.5 bg-red-light-6 px-2 py-1 rounded-md">
        <svg 
          className="w-4 h-4 text-red" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd" 
          />
        </svg>
        <span className="text-sm font-semibold text-red">Must be 18+</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-dark">Personal Information</h2>
        <p className="text-sm text-gray-500">Please provide your personal details for verification</p>
      </header>

      <div className="space-y-6">
        {/* Name Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="firstName" className="text-sm font-medium text-dark">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleNameInput}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
              placeholder="John"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lastName" className="text-sm font-medium text-dark">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleNameInput}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Date of Birth & Nationality */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="dateOfBirth" className="text-sm font-medium text-dark">
              Date of Birth
            </label>
            <div className={`relative ${styles.datePickerWrapper}`}>
              <DatePicker
                selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                onChange={handleDateChange}
                dateFormat="MMMM d, yyyy"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all pr-42.5"
                placeholderText="Select date"
                required
              />
              {renderAgeVerification()}
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="nationality" className="text-sm font-medium text-dark">
              Nationality
            </label>
            <Select
              id="nationality"
              name="nationality"
              options={countries}
              value={countries.find(country => country.label === formData.nationality)}
              onChange={(option) => handleCountrySelect(option, { name: "nationality" })}
              className={styles.select}
              classNamePrefix="react-select"
              placeholder="Select nationality"
              required
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-dark">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
            placeholder="john.doe@example.com"
          />
        </div>

        {/* Address Group */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="address" className="text-sm font-medium text-dark">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              required
              value={formData.address}
              onChange={handleAddressInput}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="city" className="text-sm font-medium text-dark">
                City
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleAddressInput}
                  className={`w-full px-4 py-2.5 rounded-lg border ${cityError ? 'border-red' : 'border-gray-300'} outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400`}
                  placeholder="New York"
                />
                {cityError && (
                  <p className="absolute text-xs text-red mt-1">{cityError}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="country" className="text-sm font-medium text-dark">
                Country
              </label>
              <Select
                id="country"
                name="country"
                options={countries}
                value={countries.find(country => country.label === formData.country)}
                onChange={(option) => handleCountrySelect(option, { name: "country" })}
                className={styles.select}
                classNamePrefix="react-select"
                placeholder="Select country"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="postalCode" className="text-sm font-medium text-dark">
                Postal Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleAddressInput}
                  className={`w-full px-4 py-2.5 rounded-lg border ${postalCodeError ? 'border-red' : 'border-gray-300'} outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400`}
                  placeholder="10001"
                />
                {postalCodeError && (
                  <p className="absolute text-xs text-red mt-1">{postalCodeError}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Seller Toggle */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isBusinessSeller"
              name="isBusinessSeller"
              checked={formData.isBusinessSeller}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
            />
            <label htmlFor="isBusinessSeller" className="text-sm font-medium text-dark">
              I am a business seller
            </label>
          </div>

          {formData.isBusinessSeller && (
            <>
              <div className="space-y-1">
                <label htmlFor="businessTaxId" className="text-sm font-medium text-dark">
                  Business Tax ID (EIN, VAT, GST)
                </label>
                <input
                  type="text"
                  id="businessTaxId"
                  name="businessTaxId"
                  required={formData.isBusinessSeller}
                  value={formData.businessTaxId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
                  placeholder="Enter your business tax ID"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="proofOfAddress" className="text-sm font-medium text-dark">
                  Proof of Address (PDF/JPEG)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="proofOfAddress"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-8 h-8 mb-4 text-gray-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF or JPEG (MAX. 10MB)</p>
                    </div>
                    <input
                      id="proofOfAddress"
                      name="proofOfAddress"
                      type="file"
                      accept=".pdf,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleFileChange}
                      required={formData.isBusinessSeller}
                    />
                  </label>
                </div>
                {formData.proofOfAddress && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {formData.proofOfAddress.name} uploaded
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;