// API functions for fetching market data

import type { MarketData } from "../types";

/**
 * Fetches market data from the API
 */
export async function fetchMarketData(): Promise<MarketData> {
  const response = await fetch("/api/market-data");

  if (!response.ok) {
    throw new Error(`Failed to fetch market data: ${response.status}`);
  }

  return response.json();
}
