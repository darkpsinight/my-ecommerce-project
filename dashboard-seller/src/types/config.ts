export interface ConfigResponse {
  configs: {
    APP_NAME: string;
    [key: string]: any; // Allow for additional configuration properties
  };
}