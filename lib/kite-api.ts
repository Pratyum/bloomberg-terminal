import type { PortfolioHolding } from "kiteconnect";

const apiKey = process.env.KITE_API_KEY;

interface KiteConnectInstance {
  getLoginURL(): string;
  generateSession(
    requestToken: string,
    apiSecret: string
  ): Promise<{
    access_token: string;
    user_id: string;
    user_name: string;
    email: string;
  }>;
  setAccessToken(accessToken: string): void;
  getProfile(): Promise<{
    user_id: string;
    user_name: string;
    email: string;
    broker: string;
    exchanges: string[];
    products: string[];
    order_types: string[];
    meta: Record<string, unknown>;
  }>;
  getHoldings(): Promise<PortfolioHolding[]>;
  getQuote(instruments: string | string[]): Promise<Record<string, unknown>>;
}

export interface KiteHoldingsItem {
  trading_symbol: string;
  exchange: string;
  instrument_token: number;
  isin: string;
  quantity: number;
  average_price: number;
  last_price: number;
  current_value: number;
  pnl: number;
  pnl_percent: number;
  product: string;
}

export interface KiteProfile {
  user_id: string;
  user_name: string;
  email: string;
  broker: string;
  exchanges: string[];
  products: string[];
  order_types: string[];
  meta: Record<string, unknown>;
}

function getKiteConnectInstance(): KiteConnectInstance | null {
  if (!apiKey) {
    console.error("KITE_API_KEY not configured");
    return null;
  }
  // Dynamic require to avoid TypeScript issues with kiteconnect types
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const KiteConnect = require("kiteconnect");
  return new KiteConnect.KiteConnect({ api_key: apiKey });
}

export function getKiteLoginUrl(): string | null {
  const kc = getKiteConnectInstance();
  if (!kc) return null;
  return kc.getLoginURL();
}

export async function generateSession(requestToken: string, apiSecret: string) {
  const kc = getKiteConnectInstance();
  if (!kc) throw new Error("KITE not configured");

  const response = await kc.generateSession(requestToken, apiSecret);
  return response;
}

export async function getProfile(accessToken: string): Promise<KiteProfile | null> {
  const kc = getKiteConnectInstance();
  if (!kc) return null;

  kc.setAccessToken(accessToken);
  try {
    const profile = (await kc.getProfile()) as KiteProfile;
    return profile;
  } catch (error) {
    console.error("Error fetching KITE profile:", error);
    return null;
  }
}

export async function getHoldings(accessToken: string): Promise<KiteHoldingsItem[]> {
  const kc = getKiteConnectInstance();
  if (!kc) return [];

  kc.setAccessToken(accessToken);
  try {
    const holdings = (await kc.getHoldings()) as PortfolioHolding[];

    return holdings.map((h) => {
      const currentValue = h.quantity * h.last_price;
      const investedValue = h.quantity * h.average_price;
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

      return {
        trading_symbol: h.tradingsymbol,
        exchange: h.exchange,
        instrument_token: h.instrument_token,
        isin: h.isin,
        quantity: h.quantity,
        average_price: h.average_price,
        last_price: h.last_price,
        current_value: currentValue,
        pnl,
        pnl_percent: pnlPercent,
        product: h.product,
      };
    });
  } catch (error) {
    console.error("Error fetching KITE holdings:", error);
    return [];
  }
}

export async function getHoldingsWithQuotes(
  accessToken: string
): Promise<(KiteHoldingsItem & { quote?: { price: number; change: number } })[]> {
  const holdings = await getHoldings(accessToken);

  if (holdings.length === 0) return [];

  const instruments = holdings.map(
    (h) => `${h.exchange}:${h.trading_symbol.replace(/ & /g, "%26")}`
  );

  try {
    const quotes = await getKiteQuotes(accessToken, instruments);

    return holdings.map((holding) => {
      const instrument = `${holding.exchange}:${holding.trading_symbol.replace(/ & /g, "%26")}`;
      const quote = quotes[instrument];

      if (quote) {
        const currentValue = holding.quantity * quote.last_price;
        const investedValue = holding.quantity * holding.average_price;
        const pnl = currentValue - investedValue;
        const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

        return {
          ...holding,
          last_price: quote.last_price,
          current_value: currentValue,
          pnl,
          pnl_percent: pnlPercent,
          quote: {
            price: quote.last_price,
            change: (quote as { net_change?: number }).net_change ?? 0,
          },
        };
      }

      return holding;
    });
  } catch (error) {
    console.error("Error fetching quotes for holdings:", error);
    return holdings;
  }
}

interface KiteQuote {
  last_price: number;
  net_change?: number;
}

export async function getKiteQuotes(
  accessToken: string,
  instruments: string[]
): Promise<Record<string, KiteQuote>> {
  const kc = getKiteConnectInstance();
  if (!kc) return {};

  kc.setAccessToken(accessToken);
  try {
    const quotes = (await kc.getQuote(instruments)) as Record<string, KiteQuote>;
    return quotes;
  } catch (error) {
    console.error("Error fetching KITE quotes:", error);
    return {};
  }
}
