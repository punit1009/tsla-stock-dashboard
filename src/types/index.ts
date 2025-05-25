export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  direction: 'LONG' | 'SHORT' | 'None';
  support: string; // Format: "[price1, price2, ...]"
  resistance: string; // Format: "[price1, price2, ...]"
}