// ID Number validation based on ID type
export const getIdNumberValidation = (idType: string): { pattern: string, message: string } => {
  switch (idType) {
    case 'passport':
      // Passport format: 9 alphanumeric characters
      return {
        pattern: '^[A-Z0-9]{8,9}$',
        message: 'Passport numbers typically have 8-9 alphanumeric characters'
      };
    case 'driverLicense':
      // Driver's license format varies by country, this is a general pattern
      return {
        pattern: '^[A-Z0-9]{5,20}$',
        message: 'Driver\'s license numbers typically have 5-20 alphanumeric characters'
      };
    case 'nationalId':
      // National ID format varies by country, this is a general pattern
      return {
        pattern: '^[A-Z0-9]{6,12}$',
        message: 'National ID numbers typically have 6-12 alphanumeric characters'
      };
    default:
      return {
        pattern: '^[A-Z0-9]{5,20}$',
        message: 'Please enter a valid ID number'
      };
  }
}; 