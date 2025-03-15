import { StepProps } from "../types";

const PersonalInfoStep = ({ formData, handleInputChange }: StepProps) => {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>
        <p className="text-sm text-gray-500">Please provide your personal details for verification</p>
      </header>

      <div className="space-y-6">
        {/* Name Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
              placeholder="John"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Contact Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
              placeholder="john.doe@example.com"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              required
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        {/* Address Group */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="address" className="text-sm font-medium text-gray-700">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              required
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="city" className="text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
                placeholder="New York"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="country" className="text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                required
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
                placeholder="United States"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                required
                value={formData.postalCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 transition-all placeholder:text-gray-400"
                placeholder="10001"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;