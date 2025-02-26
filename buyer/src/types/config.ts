export interface PublicConfigs {
  APP_NAME: string;
  PROVIDER_LOGIN_EMAIL_CONFIRMATION_REQUIRED: boolean;
  SEND_NEW_LOGIN_EMAIL: boolean;
  SUPPORT_EMAIL: string;
}

export interface ConfigResponse {
  configs: PublicConfigs;
}
