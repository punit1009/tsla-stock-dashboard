
interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  direction?: 'LONG' | 'SHORT' | 'NEUTRAL';
}

interface AnalysisContext {
  dataSummary: string;
  recentData: StockData[];
  symbol: string;
  timeFrame: string;
  query: string;
}

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 1000; // 1 second

import { geminiProxyRequest } from './apiService';

const geminiRequest = async (prompt: string, retries = MAX_RETRIES): Promise<string> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await geminiProxyRequest(prompt);
    } catch (error) {
      if (attempt === retries) {
        console.error('Final attempt failed:', error);
        throw new Error(`Failed to get response from AI service: ${error instanceof Error ? error.message : String(error)}`);
      }
      console.warn(`Attempt ${attempt + 1} failed, retrying...`, error);
      // Exponential backoff for retries
      await new Promise(resolve => setTimeout(resolve, INITIAL_RETRY_DELAY * Math.pow(2, attempt)));
    }
  }
  
  throw new Error('Max retries exceeded');
};

export const analyzeStockData = async (context: AnalysisContext): Promise<string> => {
  const { recentData, symbol, timeFrame, query } = context;
  
  // Calculate some basic stats for context
  const prices = recentData.map(d => d.close);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  // Get min/max values
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = ((maxPrice - minPrice) / minPrice * 100).toFixed(2);
  
  // Prepare recent data for context - only use last 3 data points to keep it concise
  const recentDataStr = recentData
    .slice(-3)
    .map(d => `${d.date}: Close $${d.close} | Vol: ${(d.volume/1000).toFixed(0)}K`)
    .join('\n');

  const prompt = `You are an expert financial analyst specializing in ${symbol} stock. You provide concise, actionable insights in a conversational tone.

Stock: ${symbol} | Time Frame: ${timeFrame}
Avg Price: $${avgPrice.toFixed(2)} | Price Range: ${priceRange}%
Recent Data:
${recentDataStr}

User Query: "${query}"

Provide a brief, friendly response that includes:

1. A 1-2 sentence summary of the current trend
2. The most relevant 2-3 technical insights
3. 1-2 actionable takeaways or trading ideas

Keep your entire response under 250 words. Use simple language and focus on being helpful. Do not use asterisks or any special formatting. Do not mention data limitations or issues. Always provide analysis regardless of data quality. Sound confident and direct.`;

  return geminiRequest(prompt);
};

export const generateTradingInsights = async (data: StockData[], symbol: string): Promise<string> => {

  // Get last 5 days of data for recent context
  const recentData = data.slice(-5);
  const latest = recentData[recentData.length - 1];
  
  // Calculate some basic stats
  const priceChange = recentData.length > 1 
    ? ((latest.close - recentData[0].close) / recentData[0].close * 100).toFixed(2)
    : '0.00';
    
  const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length;
  const volumeChange = ((latest.volume - avgVolume) / avgVolume * 100).toFixed(2);
  
  // Count bullish vs bearish days
  const bullishDays = recentData.filter(d => d.close > d.open).length;
  const bearishDays = recentData.filter(d => d.close < d.open).length;
  const sentiment = bullishDays > bearishDays ? 'Bullish' : bullishDays < bearishDays ? 'Bearish' : 'Neutral';
  
  const summary = `
Symbol: ${symbol}
Latest Close: $${latest.close}
Recent Price Change: ${priceChange}%
Recent Volume Change: ${volumeChange}%
Overall Sentiment: ${sentiment} (${bullishDays} bullish days vs ${bearishDays} bearish days)
`;
  
  const prompt = `You are a helpful trading assistant providing actionable insights on ${symbol} stock.

${summary}

Provide 3-4 concise trading insights based on this data. Focus on:

1. Current trend direction and strength
2. Potential short-term opportunities
3. Key price levels to watch

Keep your response under 200 words, use a friendly tone. Do not use asterisks or any special formatting. Do not mention data limitations or issues. Always provide analysis regardless of data quality. Sound confident and direct. Avoid disclaimers and technical jargon.`;
  
  return geminiRequest(prompt);
};

export const getTechnicalIndicators = async (data: StockData[]): Promise<string> => {
  
  // Get recent data for calculations
  const recentData = data.slice(-10); // Use up to 10 days if available
  const latest = recentData[recentData.length - 1];
  
  // Calculate simple moving averages
  const calculateSMA = (prices: number[], period: number): number => {
    if (prices.length < period) return 0;
    return prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
  };
  
  const closePrices = recentData.map(d => d.close);
  const sma5 = calculateSMA(closePrices, 5);
  const sma10 = recentData.length >= 10 ? calculateSMA(closePrices, 10) : 0;
  
  // Calculate RSI (simplified)
  const calculateSimpleRSI = (prices: number[]): number => {
    if (prices.length < 3) return 50; // Default neutral
    
    let gains = 0, losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i-1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  };
  
  const rsi = calculateSimpleRSI(closePrices);
  
  // Determine trend and momentum
  const trend = latest.close > sma5 ? 'Bullish' : latest.close < sma5 ? 'Bearish' : 'Neutral';
  const momentum = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
  
  // Create a user-friendly prompt
  const prompt = `You are a helpful trading assistant explaining technical indicators for ${latest.date} in simple terms.

Key Indicators:
- Current Price: $${latest.close}
- 5-Day SMA: $${sma5.toFixed(2)}
- 10-Day SMA: ${sma10 ? '$' + sma10.toFixed(2) : sma5.toFixed(2)}
- RSI: ${rsi.toFixed(1)}
- Trend: ${trend}
- Momentum: ${momentum}

Explain what these indicators suggest about the stock in simple, actionable terms. Keep your response under 150 words, use a friendly tone. Do not use asterisks or any special formatting. Do not mention data limitations or issues. Always provide analysis regardless of data quality. Sound confident and direct. Avoid disclaimers and technical jargon.`;
  
  return geminiRequest(prompt);
};