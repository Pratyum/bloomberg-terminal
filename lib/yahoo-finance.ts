import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

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
  "NIFTY 50": "^NSEI",
  SENSEX: "^BSESN",
  "NIFTY BANK": "^NSEBANK",
  "NIFTY IT": "^NSEMO",
  "NIFTY AUTO": "^NIFTYAUTO",
  "NIFTY PHARMA": "^NIFTYPHARMA",
  "NIFTY METAL": "^NIFTYMETAL",
  "NIFTY FMCG": "^NIFTYFMCG",
  "NIFTY ENERGY": "^NIFTYENERGY",
  "NIFTY REALTY": "^NIFTYREALTY",
  "NIFTY COMMODITIES": "^NIFTYCOMMODITIES",
  "NIFTY PSE": "^NIFTYPSE",
  "NIFTY FIN SERVICE": "^NIFTYFINSERV",
  "NIFTY MEDIA": "^NIFTYMEDIA",
  "NIFTY PRIVATE BANK": "^NIFTYPRIVATEBANK",
  "NIFTY PSU BANK": "^NIFTYPSUBANK",
  "NIFTY GROWTH SECTOR 15": "^NIFTYGROWTHSECTOR15",
  "NIFTY 100": "^NIFTY100",
  "NIFTY MIDCAP 50": "^NIFTYMIDCAP50",
  "NIFTY SMALLCAP 100": "^NIFTYSMALLCAP100",
  "Euro Stoxx 50": "^STOXX50E",
  "FTSE 100": "^FTSE",
  DAX: "^GDAXI",
  "CAC 40": "^FCHI",
  "IBEX 35": "^IBEX",
  "FTSE MIB": "FTSEMIB.MI",
  "OMX STKH30": "^OMXS30",
  "SWISS MKT": "^SSMI",
  "NIKKEI 225": "^N225",
  "HANG SENG": "^HSI",
  "CSI 300": "000300.SS",
  "S&P/ASX 200": "^AXJO",
  KOSPI: "^KS11",
};

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
  normalized: { timestamp: string; value: number }[] | null;
  sparkline: number[] | null;
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
      interval: "1d",
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

      if (sortedData.length < 2) {
        return {
          raw: sortedData,
          normalized: null,
          sparkline: null,
        };
      }

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

interface MarketIndexData {
  id: string;
  num: string;
  rmi: string;
  value: number;
  change: number;
  pctChange: number;
  avat: number | null;
  time: string;
  ytd: number | null;
  ytdCur: number | null;
  sparkline1: number[] | null;
  sparkline2: number[] | null;
  twoDayData?: { timestamp: string; close: number }[] | null;
}

export interface FetchAllMarketDataResult {
  india: MarketIndexData[];
  emea: MarketIndexData[];
  asiaPacific: MarketIndexData[];
  lastUpdated: string;
  dataSource: string;
  [key: string]: MarketIndexData[] | string | boolean | undefined;
}

export async function fetchAllMarketData(): Promise<FetchAllMarketDataResult> {
  const regions = {
    india: [
      "NIFTY 50",
      "SENSEX",
      "NIFTY BANK",
      "NIFTY IT",
      "NIFTY AUTO",
      "NIFTY PHARMA",
      "NIFTY METAL",
      "NIFTY FMCG",
      "NIFTY ENERGY",
      "NIFTY REALTY",
      "NIFTY COMMODITIES",
      "NIFTY PSE",
      "NIFTY FIN SERVICE",
      "NIFTY MEDIA",
      "NIFTY PRIVATE BANK",
      "NIFTY PSU BANK",
      "NIFTY GROWTH SECTOR 15",
      "NIFTY 100",
      "NIFTY MIDCAP 50",
      "NIFTY SMALLCAP 100",
    ],
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
    asiaPacific: ["NIKKEI 225", "HANG SENG", "CSI 300", "S&P/ASX 200"],
  };

  const result: FetchAllMarketDataResult = {
    india: [],
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

        if (!symbol) {
          console.warn(`No symbol found for index: ${indexName}`);
          continue;
        }

        const [quote, historicalData] = await Promise.all([
          fetchQuote(symbol),
          fetchHistoricalData(symbol),
        ]);

        if (quote) {
          const value = quote.regularMarketPrice ?? 0;
          const change = quote.regularMarketChange ?? 0;
          const pctChange = quote.regularMarketChangePercent ?? 0;

          const sparkline1 = historicalData?.sparkline
            ? historicalData.sparkline.slice(0, 8)
            : null;
          const sparkline2 = historicalData?.sparkline ? historicalData.sparkline.slice(-8) : null;

          result[regionKey].push({
            id: indexName,
            num: `${region === "india" ? "1" : region === "emea" ? "2" : "3"}${i + 1})`,
            rmi: "□",
            value,
            change,
            pctChange,
            avat: null,
            time: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            ytd: null,
            ytdCur: null,
            sparkline1,
            sparkline2,
            twoDayData: historicalData ? historicalData.raw : null,
          });
        }
      } catch (error) {
        console.error(`Error processing ${indexName}:`, error);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return result;
}
