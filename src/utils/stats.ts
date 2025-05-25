import { StockData } from '../types';

export const calculateStats = (data: StockData[]): {
  bullish: number;
  bearish: number;
  neutral: number;
  avgVolume: number;
} => {
  let bullish = 0;
  let bearish = 0;
  let neutral = 0;
  let totalVolume = 0;

  data.forEach(item => {
    if (item.direction === 'LONG') {
      bullish++;
    } else if (item.direction === 'SHORT') {
      bearish++;
    } else {
      neutral++;
    }
    totalVolume += item.volume;
  });

  return {
    bullish,
    bearish,
    neutral,
    avgVolume: data.length > 0 ? totalVolume / data.length : 0
  };
};
