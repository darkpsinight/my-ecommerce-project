interface DecodedToken {
  uid: string;
  name: string;
  email: string;
  roles: string[];
  isEmailConfirmed: boolean;
  iat: number;
  exp: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Helper function to check if user has a specific role
export const hasRole = (decodedToken: DecodedToken | null, role: string): boolean => {
  return decodedToken?.roles?.includes(role) || false;
};