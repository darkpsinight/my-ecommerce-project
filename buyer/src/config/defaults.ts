import { PublicConfigs } from "@/types/config";

// API URL - this is the only env variable we need since it's required for deployment
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Default fallback configurations (used only if API fails)
export const defaultConfigs: PublicConfigs = {
  APP_NAME: 'CodeSale',
  PROVIDER_LOGIN_EMAIL_CONFIRMATION_REQUIRED: false,
  SEND_NEW_LOGIN_EMAIL: false,
  SUPPORT_EMAIL: 'support@codesale.com'
}; 