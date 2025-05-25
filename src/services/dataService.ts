import { StockData } from '../types';
import * as XLSX from 'xlsx';

// Utility to robustly map Excel row to StockData (returns null if invalid)
function mapRowToStockData(row: any): StockData | null {
  // Try to extract a valid date string
  let dateValue = row.Date || row.date || row.timestamp;
  let dateString: string | null = null;

  if (dateValue instanceof Date) {
    dateString = dateValue.toISOString().split('T')[0];
  } else if (typeof dateValue === 'number' && !isNaN(dateValue)) {
    // Excel serial date (days since 1899-12-30)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    dateString = jsDate.toISOString().split('T')[0];
  } else if (typeof dateValue === 'string' && !isNaN(new Date(dateValue).getTime())) {
    dateString = new Date(dateValue).toISOString().split('T')[0];
  }
  // If dateString is invalid, skip this row
  if (!dateString || dateString === 'undefined' || isNaN(new Date(dateString).getTime())) {
    console.warn('Skipping row with invalid date:', row);
    return null;
  }

  // Parse and validate number columns
  const open = Number(row.Open || row.open);
  const high = Number(row.High || row.high);
  const low = Number(row.Low || row.low);
  const close = Number(row.Close || row.close);

  if ([open, high, low, close].some(val => typeof val !== 'number' || isNaN(val))) {
    console.warn('Skipping row with invalid OHLC:', row);
    return null;
  }

  // Parse support/resistance as arrays of numbers
  let supportArr: number[] = [];
  let resistanceArr: number[] = [];
  try {
    const s = row.Support || row.support || '[]';
    supportArr = Array.isArray(s) ? s : JSON.parse(String(s).replace(/'/g, '"'));
  } catch (e) {
    supportArr = [];
  }
  try {
    const r = row.Resistance || row.resistance || '[]';
    resistanceArr = Array.isArray(r) ? r : JSON.parse(String(r).replace(/'/g, '"'));
  } catch (e) {
    resistanceArr = [];
  }

  // Normalize direction
  let direction: 'LONG' | 'SHORT' | 'None' = 'None';
  const dir = (row.Direction || row.direction || '').toString().toUpperCase();
  if (dir === 'LONG' || dir === 'SHORT') direction = dir;

  return {
    date: dateString,
    open,
    high,
    low,
    close,
    volume: Number(row.Volume || row.volume),
    direction,
    support: JSON.stringify(supportArr),
    resistance: JSON.stringify(resistanceArr),
  };
}

export const fetchStockData = async (startDate?: string, endDate?: string): Promise<StockData[]> => {
  try {
    const response = await fetch('/TSLA_data.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    let stockData: StockData[] = (jsonData as any[]).map(mapRowToStockData).filter((d): d is StockData => d !== null);

    // Remove duplicate dates, keeping the last occurrence and sort by date
    const seen = new Map<string, StockData>();
    for (const item of stockData) {
      seen.set(item.date, item); // keeps last occurrence
    }
    stockData = Array.from(seen.values());

    // Sort data by date in ascending order
    stockData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    // Filter by date range if specified
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('2022-08-25');
      const end = endDate ? new Date(endDate) : new Date('2025-05-25');
      
      stockData = stockData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });
    }

    console.log(`Stock data after cleaning and sorting: ${stockData.length} rows`);
    return stockData;
  } catch (err: any) {
    console.error('Error fetching stock data:', err);
    return [];
  }
};