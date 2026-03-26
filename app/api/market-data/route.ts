import { marketData as fallbackData } from "@/components/bloomberg/lib/marketData";
import type { MarketData } from "@/components/bloomberg/types";
import refreshMarketData from "@/lib/market-data-refresh";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

// Initialize the market data refresh scheduler
// This is imported here so it starts when the API route is first loaded
import "@/lib/market-data-refresh";

// Helper function to get fallback data (without fake sparklines)
function getFallbackData() {
  const now = new Date().toISOString();
  return Object.keys(fallbackData).reduce<MarketData>(
    (acc: MarketData, key: string) => {
      if (key === "india" || key === "emea" || key === "asiaPacific") {
        acc[key] = fallbackData[key].map((item) => ({
          id: item.id,
          num: item.num,
          rmi: item.rmi,
          value: item.value,
          change: item.change,
          pctChange: item.pctChange,
          avat: item.avat,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          ytd: item.ytd,
          ytdCur: item.ytdCur,
          sparkline1: null,
          sparkline2: null,
          lastUpdated: now,
          sparklineUpdated: now,
        }));
      }
      return acc;
    },
    {
      ...fallbackData,
      lastSparklineUpdate: now,
    }
  );
}

export async function GET() {
  try {
    // Check if Redis is connected
    let isConnected = false;
    let redisData = null;

    try {
      await redis.ping();
      isConnected = true;

      // Try to get market data from Redis
      redisData = await redis.get("market_data");
    } catch (redisError) {
      console.warn("Redis error:", redisError);
      isConnected = false;
    }

    if (!isConnected || !redisData) {
      console.log("Using fallback data");
      const fallback = getFallbackData();

      return NextResponse.json({
        ...fallback,
        isFromRedis: false,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Return the data from Redis with timestamp
    return NextResponse.json({
      ...redisData,
      isFromRedis: true,
      lastFetched: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in market-data GET route:", error);
    const fallback = getFallbackData();

    return NextResponse.json({
      ...fallback,
      isFromRedis: false,
      error: String(error),
      lastUpdated: new Date().toISOString(),
    });
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "No real-time data available",
    },
    { status: 503 }
  );
}
