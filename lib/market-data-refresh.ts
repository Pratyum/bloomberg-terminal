/**
 * Market data refresh task
 * Fetches fresh data from Yahoo Finance and updates Redis
 */

import { redis } from "./redis";
import scheduler from "./scheduler";
import { fetchAllMarketData } from "./yahoo-finance";

export async function refreshMarketData(): Promise<void> {
  try {
    console.log("Starting market data refresh from Yahoo Finance...");

    const existingData = await redis.get("market_data");

    if (!existingData || shouldRefreshData(existingData)) {
      const marketData = await fetchAllMarketData();

      const totalIndices =
        marketData.india.length + marketData.emea.length + marketData.asiaPacific.length;

      if (totalIndices < 5) {
        throw new Error("Not enough data received from Yahoo Finance");
      }

      const dataWithTimestamp = {
        ...marketData,
        lastUpdated: new Date().toISOString(),
        lastFullRefresh: new Date().toISOString(),
      };

      await redis.set("market_data", dataWithTimestamp, { ex: 48 * 60 * 60 });

      console.log("Market data successfully refreshed and stored in Redis");
      return;
    }

    console.log("Recent market data found in Redis, skipping refresh");
  } catch (error) {
    console.error("Error refreshing market data:", error);
    throw error;
  }
}

function shouldRefreshData(data: { lastFullRefresh?: string }): boolean {
  if (!data.lastFullRefresh) return true;

  const lastRefresh = new Date(data.lastFullRefresh).getTime();
  const now = Date.now();
  const hoursSinceLastRefresh = (now - lastRefresh) / (1000 * 60 * 60);

  return hoursSinceLastRefresh > 23;
}

scheduler.register(
  "market-data-refresh",
  "Yahoo Finance Market Data Refresh",
  5,
  refreshMarketData
);

export default refreshMarketData;
