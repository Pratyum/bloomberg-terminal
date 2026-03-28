import { supabase } from "./supabase";
import { supabaseService } from "./supabase-service";

export interface MarketData {
  nifty50: unknown[];
  sensex: unknown[];
  bankNifty: unknown[];
  finNifty: unknown[];
  timestamp: string;
}

export const supabaseDb = {
  async getMarketData(): Promise<MarketData | null> {
    const { data, error } = await supabase
      .from("market_data")
      .select("data, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.data as MarketData;
  },

  async setMarketData(marketData: MarketData, expirySeconds?: number): Promise<boolean> {
    const { error } = await supabaseService.from("market_data").insert([
      {
        data: marketData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Failed to set market data:", error);
      throw new Error(`Failed to set market data: ${error.message}`);
    }

    return true;
  },

  async getRateLimit(key: string): Promise<{ count: number; expiresAt: Date } | null> {
    const { data, error } = await supabase.from("rate_limits").select("*").eq("key", key).single();

    if (error || !data) {
      return null;
    }

    if (new Date(data.expires_at) < new Date()) {
      await supabaseService.from("rate_limits").delete().eq("key", key);
      return null;
    }

    return {
      count: data.count,
      expiresAt: new Date(data.expires_at),
    };
  },

  async incrementRateLimit(
    key: string,
    windowSeconds: number
  ): Promise<{ count: number; expiresAt: Date }> {
    const { data, error } = await supabaseService.rpc("increment_rate_limit", {
      key,
      window_seconds: windowSeconds,
    });

    if (error) {
      console.error("Failed to increment rate limit:", error);
      throw new Error(`Rate limit increment failed: ${error.message}`);
    }

    if (!data) {
      throw new Error("Rate limit increment returned no data");
    }

    return {
      count: data.count,
      expiresAt: new Date(data.expires_at),
    };
  },
};
