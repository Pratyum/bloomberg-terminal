import yahooFinance from "yahoo-finance2";

interface YahooQuote {
  regularMarketPrice: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
}

interface YahooHistoricalItem {
  date: Date;
  close: number;
}

const MARKET_INDICES: Record<string, string> = {
  "DOW JONES": "^DJI",
  "S&P 500": "^GSPC",
  NASDAQ: "^IXIC",
  "S&P/TSX Comp": "^GSPTSE",
  "S&P/BMV IPC": "^MXX",
  IBOVESPA: "^BVSP",
  "Euro Stoxx 50": "^STOXX50E",
  "FTSE 100": "^FTSE",
  "CAC 40": "^FCHI",
  DAX: "^GDAXI",
  "IBEX 35": "^IBEX",
  "FTSE MIB": "FTSEMIB.MI",
  "OMX STKH30": "^OMX",
  "SWISS MKT": "^SSMI",
  NIKKEI: "^N225",
  "HANG SENG": "^HSI",
  "CSI 300": "000300.SS",
  "S&P/ASX 200": "^AXJO",
};

export function generateRandomSparkline(): number[] {
  return Array.from({ length: 8 }, () => Math.min(1, Math.max(0, Math.random())));
}

export async function fetchQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    const quote = (await yahooFinance.quote(symbol)) as YahooQuote;
    return quote;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

interface HistoricalDataResult {
  raw: { timestamp: string; close: number }[];
  normalized: { timestamp: string; value: number }[];
  sparkline: number[];
}

export async function fetchHistoricalData(
  symbol: string,
  days = 2
): Promise<HistoricalDataResult | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const historical = (await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1h",
    })) as YahooHistoricalItem[];

    if (historical && historical.length > 0) {
      const sortedData = historical
        .sort(
          (a: YahooHistoricalItem, b: YahooHistoricalItem) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        .map((item: YahooHistoricalItem) => ({
          timestamp: item.date.toISOString(),
          close: item.close,
        }));

      const values = sortedData.map((item) => item.close);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;

      return {
        raw: sortedData,
        normalized: sortedData.map((item) => ({
          timestamp: item.timestamp,
          value: (item.close - min) / range,
        })),
        sparkline: sortedData.map((item) => (item.close - min) / range),
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
}

export function generateFallbackData(indexName: string, region: string, index: number) {
  const value = 1000 + Math.random() * 10000;
  const change = Math.random() * 100 - 50;
  const pctChange = (change / value) * 100;

  return {
    id: indexName,
    num: `${region === "americas" ? "1" : region === "emea" ? "2" : "3"}${index + 1})`,
    rmi: "□",
    value,
    change,
    pctChange,
    avat: Math.random() * 100 - 50,
    time: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    ytd: Math.random() * 30 - 15,
    ytdCur: Math.random() * 30 - 10,
    sparkline1: generateRandomSparkline(),
    sparkline2: generateRandomSparkline(),
  };
}

interface MarketIndexData {
  id: string;
  num: string;
  rmi: string;
  value: number;
  change: number;
  pctChange: number;
  avat: number;
  time: string;
  ytd: number;
  ytdCur: number;
  sparkline1: number[];
  sparkline2: number[];
  twoDayData?: { timestamp: string; close: number }[] | null;
}

export interface FetchAllMarketDataResult {
  americas: MarketIndexData[];
  emea: MarketIndexData[];
  asiaPacific: MarketIndexData[];
  lastUpdated: string;
  dataSource: string;
  [key: string]: MarketIndexData[] | string | boolean | undefined;
}

export async function fetchAllMarketData(): Promise<FetchAllMarketDataResult> {
  const regions = {
    americas: ["DOW JONES", "S&P 500", "NASDAQ", "S&P/TSX Comp", "S&P/BMV IPC", "IBOVESPA"],
    emea: [
      "Euro Stoxx 50",
      "FTSE 100",
      "CAC 40",
      "DAX",
      "IBEX 35",
      "FTSE MIB",
      "OMX STKH30",
      "SWISS MKT",
    ],
    asiaPacific: ["NIKKEI", "HANG SENG", "CSI 300", "S&P/ASX 200"],
  };

  const result: FetchAllMarketDataResult = {
    americas: [],
    emea: [],
    asiaPacific: [],
    lastUpdated: new Date().toISOString(),
    dataSource: "yahoo-finance",
  };

  for (const [region, indices] of Object.entries(regions)) {
    const regionKey = region as keyof typeof regions;
    for (let i = 0; i < indices.length; i++) {
      const indexName = indices[i];

      try {
        const symbol = MARKET_INDICES[indexName];

        const [quote, historicalData] = await Promise.all([
          fetchQuote(symbol),
          fetchHistoricalData(symbol),
        ]);

        if (quote) {
          const value = quote.regularMarketPrice ?? 0;
          const change = quote.regularMarketChange ?? 0;
          const pctChange = quote.regularMarketChangePercent ?? 0;

          const avat = Math.random() * 100 - 50;
          const ytd = Math.random() * 30 - 15;
          const ytdCur = Math.random() * 30 - 10;

          const sparkline1 = historicalData
            ? historicalData.sparkline.slice(0, 8)
            : generateRandomSparkline();
          const sparkline2 = historicalData
            ? historicalData.sparkline.slice(-8)
            : generateRandomSparkline();

          result[regionKey].push({
            id: indexName,
            num: `${region === "americas" ? "1" : region === "emea" ? "2" : "3"}${i + 1})`,
            rmi: "□",
            value,
            change,
            pctChange,
            avat,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            ytd,
            ytdCur,
            sparkline1,
            sparkline2,
            twoDayData: historicalData ? historicalData.raw : null,
          });
        } else {
          result[regionKey].push(generateFallbackData(indexName, region, i));
        }
      } catch (error) {
        console.error(`Error processing ${indexName}:`, error);
        result[regionKey].push(generateFallbackData(indexName, region, i));
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return result;
}
