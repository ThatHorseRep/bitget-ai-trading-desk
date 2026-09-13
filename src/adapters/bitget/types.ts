export interface RawBitgetTickerItem {
  category: string;
  symbol: string;
  ts: string;
  lastPrice: string;
  openPrice24h?: string;
  highPrice24h?: string;
  lowPrice24h?: string;
  ask1Price?: string;
  bid1Price?: string;
  bid1Size?: string;
  ask1Size?: string;
  price24hPcnt?: string;
  volume24h?: string;
  turnover24h?: string;
  platformTurnover24h?: string;
}

export interface BitgetResponse<T> {
  code: string;
  msg: string;
  requestTime: number;
  data: T;
}

export interface NormalizedBitgetTicker {
  symbol: string;
  lastPrice: number;
  bid: number | null;
  ask: number | null;
  bidSize: number | null;
  askSize: number | null;
  volume24h: number | null;
  price24hPcnt: number | null;
  observedAt: string;
  source: string;
}

export interface BitgetRealityCalendarConfig {
  remark?: string;
  startTime: string;
  endTime: string;
}

export interface BitgetRealityCalendar {
  timeZone: string;
  specificConfig: BitgetRealityCalendarConfig[];
}


