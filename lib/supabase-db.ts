import { supabase } from "./supabase";

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
    const { error } = await supabase.from("market_data").insert([
      {
        data: marketData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Failed to set market data:", error);
      return false;
    }

    return true;
  },

  async getRateLimit(key: string): Promise<{ count: number; expiresAt: Date } | null> {
    const { data, error } = await supabase.from("rate_limits").select("*").eq("key", key).single();

    if (error || !data) {
      return null;
    }

    if (new Date(data.expires_at) < new Date()) {
      await supabase.from("rate_limits").delete().eq("key", key);
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
    const existing = await this.getRateLimit(key);

    if (existing) {
      const { data, error } = await supabase
        .from("rate_limits")
        .update({
          count: existing.count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("key", key)
        .select()
        .single();

      if (error) {
        console.error("Failed to increment rate limit:", error);
      }

      return {
        count: existing.count + 1,
        expiresAt: existing.expiresAt,
      };
    }

    const expiresAt = new Date(Date.now() + windowSeconds * 1000);
    const { data, error } = await supabase
      .from("rate_limits")
      .insert([
        {
          key,
          count: 1,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Failed to create rate limit:", error);
    }

    return {
      count: 1,
      expiresAt,
    };
  },
};
