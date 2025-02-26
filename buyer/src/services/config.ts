import { ConfigResponse } from "@/types/config";
import { defaultConfigs, API_URL } from "@/config/defaults";

export async function getPublicConfigs(): Promise<ConfigResponse> {
  try {
    const response = await fetch(`${API_URL}/public/configs`, {
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch configurations:",
        response.status,
        response.statusText
      );
      throw new Error("Failed to fetch configurations");
    }

    const data = await response.json();

    // Validate that we received the expected data structure
    if (!data?.configs?.APP_NAME) {
      console.error("Invalid configuration data received:", data);
      throw new Error("Invalid configuration data");
    }

    return data;
  } catch (error) {
    console.error("Error fetching configurations:", error);
    // Return default configs as fallback only if API fails
    return {
      configs: defaultConfigs,
    };
  }
}
