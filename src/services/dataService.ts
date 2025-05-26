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

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const fetchStockData = async (startDate?: string, endDate?: string): Promise<StockData[]> => {
  try {
    // Build query parameters for date range
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = `${API_BASE_URL}/api/stock-data${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('Fetching stock data from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('Invalid data format received from API:', data);
      return [];
    }
    
    console.log(`Received ${data.length} stock data records from API`);
    return data;
  } catch (err: any) {
    console.error('Error fetching stock data from API:', err);
    return [];
  }
};