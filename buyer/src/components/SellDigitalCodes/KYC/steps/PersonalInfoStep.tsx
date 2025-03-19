import { StepProps } from "../types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import countryList from "react-select-country-list";
import { useMemo } from "react";
import styles from "./PersonalInfoStep.module.css";
import { FormField } from "../components/FormField";
import { AgeVerificationBadge } from "../components/AgeVerificationBadge";
import { usePersonalInfoValidation } from "../hooks/usePersonalInfoValidation";
import { BusinessSellerSection } from "../components/BusinessSellerSection";
import { AddressFields } from "../components/AddressFields";

const PersonalInfoStep = ({ formData, handleInputChange, handleFileChange, handleDateChange }: StepProps) => {
  const countries = useMemo(() => countryList().getData(), []);
  const { age, postalCodeError, cityError, validatePostalCode, validateCity } = usePersonalInfoValidation({
    formData,
    countries,
  });

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

  const handleCountrySelect = (selectedOption: any, action: { name: string }) => {
    if (selectedOption) {
      const event = {
        target: {
          name: action.name,
          value: selectedOption.label,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(event);

      if (formData.postalCode) {
        validatePostalCode(formData.postalCode, selectedOption.label);
      }
    }
  };

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

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-dark">Personal Information</h2>
        <div className="h-1 w-24 bg-blue mb-4 rounded-full"></div>
        <p className="text-sm text-gray-500">Please provide your personal details for verification</p>
      </header>

      <div className="space-y-6">
        {/* Name Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="First Name"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleNameInput}
            placeholder="John"
            required
          />
          <FormField
            label="Last Name"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleNameInput}
            placeholder="Doe"
            required
          />
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
              <AgeVerificationBadge age={age} />
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
        <FormField
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          placeholder="john.doe@example.com"
          required
        />

        {/* Address Fields */}
        <AddressFields
          formData={formData}
          handleAddressInput={handleAddressInput}
          handleCountrySelect={handleCountrySelect}
          countries={countries}
          cityError={cityError}
          postalCodeError={postalCodeError}
          styles={styles}
        />

        {/* Business Seller Section */}
        <BusinessSellerSection
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default PersonalInfoStep;