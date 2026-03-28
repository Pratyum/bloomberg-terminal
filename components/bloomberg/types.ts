// Define proper types for market data
export type MarketItem = {
  id: string;
  num?: string;
  rmi?: string;
  value: number;
  change: number;
  pctChange: number;
  avat: number | null;
  time: string;
  ytd: number | null;
  ytdCur: number | null;
  sparkline1?: number[] | null;
  sparkline2?: number[] | null;
  sparklineUpdated?: string;
  lastUpdated?: string;
  // Additional properties for filters
  historicalData10D?: number[];
  volatility?: number;
  isMover?: boolean;
};

export type HoldingsItem = {
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
  quote?: {
    price: number;
    change: number;
  };
};

export type MarketData = {
  india: MarketItem[];
  emea: MarketItem[];
  asiaPacific: MarketItem[];
  lastUpdated?: string;
  lastSparklineUpdate?: string;
  isFromRedis?: boolean;
  dataSource?: string;
  [key: string]: MarketItem[] | string | boolean | undefined;
};

export interface FilterState {
  showMovers: boolean;
  showVolatility: boolean;
  showRatios: boolean;
  showFutures: boolean;
  showAvat: boolean;
  show10D: boolean;
  showYTD: boolean;
  showCAD: boolean;
}
