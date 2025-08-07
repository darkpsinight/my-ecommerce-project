import axios from "axios";
import { SearchSuggestionsResponse } from "../types/SearchTypes";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async fetchSuggestions(query: string, limit: number = 8): Promise<SearchSuggestionsResponse> {
    try {
      const response = await axios.get<SearchSuggestionsResponse>(
        `${API_URL}/public/search-suggestions`,
        {
          params: { q: query.trim(), limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return { success: false, data: [] };
    }
  }
}