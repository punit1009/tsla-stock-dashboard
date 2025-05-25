import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, UTCTimestamp, IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import { StockData } from '../types';
import { BarChart2, TrendingUp, Activity, BarChart, Layers, Eye, EyeOff } from 'lucide-react';

// Technical indicator options
interface IndicatorOptions {
  sma: boolean;  // Simple Moving Average
  ema: boolean;  // Exponential Moving Average
  bollinger: boolean; // Bollinger Bands
  rsi: boolean;  // Relative Strength Index
  macd: boolean; // Moving Average Convergence Divergence
  volume: boolean; // Volume Analysis
}

interface ChartComponentProps {
  data: StockData[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<{ [key: string]: ISeriesApi<SeriesType> }>({});
  
  // State for indicator toggles
  const [indicators, setIndicators] = useState<IndicatorOptions>({
    sma: false,
    ema: false,
    bollinger: false,
    rsi: false,
    macd: false,
    volume: false
  });

  // Calculate Simple Moving Average (SMA)
  const calculateSMA = (data: number[], period: number): number[] => {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN); // Not enough data yet
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  };

  // Calculate Exponential Moving Average (EMA)
  const calculateEMA = (data: number[], period: number): number[] => {
    const result: number[] = [];
    const k = 2 / (period + 1);
    
    // First EMA is SMA
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN); // Not enough data yet
      } else if (i === period - 1) {
        result.push(ema);
      } else {
        ema = (data[i] - ema) * k + ema;
        result.push(ema);
      }
    }
    return result;
  };

  // Calculate Bollinger Bands
  const calculateBollingerBands = (data: number[], period: number, multiplier: number): { upper: number[], middle: number[], lower: number[] } => {
    const middle = calculateSMA(data, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + Math.pow(b - middle[i], 2), 0);
        const stdDev = Math.sqrt(sum / period);
        upper.push(middle[i] + multiplier * stdDev);
        lower.push(middle[i] - multiplier * stdDev);
      }
    }
    
    return { upper, middle, lower };
  };

  // Calculate RSI (Relative Strength Index)
  const calculateRSI = (data: number[], period: number): number[] => {
    const result: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate gains and losses
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }
    
    // Calculate RSI
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        result.push(NaN); // Not enough data yet
      } else {
        const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) {
          result.push(100);
        } else {
          const rs = avgGain / avgLoss;
          result.push(100 - (100 / (1 + rs)));
        }
      }
    }
    
    return result;
  };

  // Toggle indicator visibility
  const toggleIndicator = (indicator: keyof IndicatorOptions) => {
    setIndicators(prev => {
      const newState = { ...prev, [indicator]: !prev[indicator] };
      
      // Apply changes to chart
      updateChartIndicators(newState);
      
      return newState;
    });
  };

  // Update chart indicators based on current state
  const updateChartIndicators = (indicatorState: IndicatorOptions) => {
    if (!chartRef.current || !data.length) return;
    
    // Clear existing indicators
    Object.keys(seriesRef.current).forEach(key => {
      if (key !== 'candlestick') {
        // Use type assertion to access the remove method
        const series = seriesRef.current[key] as any;
        if (series && typeof series.remove === 'function') {
          series.remove();
        }
        delete seriesRef.current[key];
      }
    });
    
    const prices = data.map(item => typeof item.close === 'number' ? item.close : parseFloat(String(item.close)));
    const times = data.map(item => (new Date(item.date).getTime() / 1000) as UTCTimestamp);
    
    // Add SMA
    if (indicatorState.sma) {
      const sma20 = calculateSMA(prices, 20);
      const smaData = times.map((time, i) => ({ time, value: sma20[i] })).filter(item => !isNaN(item.value));
      
      const smaSeries = chartRef.current.addLineSeries({
        color: '#2196F3',
        lineWidth: 2,
        title: 'SMA 20',
      });
      smaSeries.setData(smaData);
      seriesRef.current['sma'] = smaSeries;
    }
    
    // Add EMA
    if (indicatorState.ema) {
      const ema9 = calculateEMA(prices, 9);
      const emaData = times.map((time, i) => ({ time, value: ema9[i] })).filter(item => !isNaN(item.value));
      
      const emaSeries = chartRef.current.addLineSeries({
        color: '#FF9800',
        lineWidth: 2,
        title: 'EMA 9',
      });
      emaSeries.setData(emaData);
      seriesRef.current['ema'] = emaSeries;
    }
    
    // Add Bollinger Bands
    if (indicatorState.bollinger) {
      const { upper, middle, lower } = calculateBollingerBands(prices, 20, 2);
      
      const upperData = times.map((time, i) => ({ time, value: upper[i] })).filter(item => !isNaN(item.value));
      const middleData = times.map((time, i) => ({ time, value: middle[i] })).filter(item => !isNaN(item.value));
      const lowerData = times.map((time, i) => ({ time, value: lower[i] })).filter(item => !isNaN(item.value));
      
      const upperSeries = chartRef.current.addLineSeries({
        color: '#E91E63',
        lineWidth: 1,
        title: 'BB Upper',
      });
      upperSeries.setData(upperData);
      seriesRef.current['bbUpper'] = upperSeries;
      
      const middleSeries = chartRef.current.addLineSeries({
        color: '#9C27B0',
        lineWidth: 1,
        title: 'BB Middle',
      });
      middleSeries.setData(middleData);
      seriesRef.current['bbMiddle'] = middleSeries;
      
      const lowerSeries = chartRef.current.addLineSeries({
        color: '#E91E63',
        lineWidth: 1,
        title: 'BB Lower',
      });
      lowerSeries.setData(lowerData);
      seriesRef.current['bbLower'] = lowerSeries;
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = {};
    }

    // Original dark chart style
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e1e30' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });
    chartRef.current = chart;

    // Enhanced date validation and deduplication
    const isValidDateEntry = (item: StockData): boolean => {
      if (!item.date || item.date === 'undefined' || item.date === 'null') return false;
      const dateObj = new Date(item.date);
      if (isNaN(dateObj.getTime())) return false;
      if (typeof item.open !== 'number' || typeof item.high !== 'number' || typeof item.low !== 'number' || typeof item.close !== 'number') return false;
      if (isNaN(item.open) || isNaN(item.high) || isNaN(item.low) || isNaN(item.close)) return false;
      return true;
    };
    
    // Clean and sort data while maintaining order
    const validData = data.filter(isValidDateEntry);
    // Since the data comes pre-sorted from dataService, we don't need to sort again
    const sortedData = validData;

    // Deduplicate while preserving order
    const deduplicatedData: StockData[] = [];
    const seenDates = new Set<string>();
    for (const item of sortedData) {
      const dateKey = item.date;
      if (!seenDates.has(dateKey)) {
        seenDates.add(dateKey);
        deduplicatedData.push(item);
      }
    }

    // Convert to chart format with proper types
    const candlestickData = deduplicatedData.map((item: StockData) => {
      // Ensure all values are numbers before using them
      const open = typeof item.open === 'number' ? item.open : parseFloat(String(item.open));
      const high = typeof item.high === 'number' ? item.high : parseFloat(String(item.high));
      const low = typeof item.low === 'number' ? item.low : parseFloat(String(item.low));
      const close = typeof item.close === 'number' ? item.close : parseFloat(String(item.close));
      
      return {
        time: (new Date(item.date).getTime() / 1000) as UTCTimestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
      };
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeries.setData(candlestickData);
    seriesRef.current['candlestick'] = candlestickSeries;
    
    // Add volume series if enabled
    if (indicators.volume) {
      // Use type assertion to avoid TypeScript errors with custom options
      const volumeSeries = chart.addHistogramSeries({
        color: '#9E9E9E',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      } as any);
      
      const volumeData = deduplicatedData.map((item) => {
        const volume = typeof item.volume === 'number' ? item.volume : parseFloat(String(item.volume));
        return {
          time: (new Date(item.date).getTime() / 1000) as UTCTimestamp,
          value: volume,
          color: item.close > item.open ? '#26a69a80' : '#ef535080',
        };
      });
      
      volumeSeries.setData(volumeData);
      seriesRef.current['volume'] = volumeSeries;
    }
    
    // Add RSI if enabled
    if (indicators.rsi) {
      // Create a separate pane for RSI (using type assertion for custom options)
      const rsiPane = chart.addLineSeries({
        color: '#7B1FA2',
        lineWidth: 2,
        priceScaleId: 'rsi',
        title: 'RSI (14)',
      } as any);
      
      const prices = deduplicatedData.map(item => typeof item.close === 'number' ? item.close : parseFloat(String(item.close)));
      const rsiValues = calculateRSI(prices, 14);
      
      const rsiData = deduplicatedData.map((item, i) => ({
        time: (new Date(item.date).getTime() / 1000) as UTCTimestamp,
        value: rsiValues[i],
      })).filter(item => !isNaN(item.value));
      
      rsiPane.setData(rsiData);
      seriesRef.current['rsi'] = rsiPane;
    }
    
    // Add other indicators based on current state
    updateChartIndicators(indicators);

    // Add markers with proper types
    const markers = deduplicatedData
      .map((item: StockData) => {
        const time = (new Date(item.date).getTime() / 1000) as UTCTimestamp;
        if (item.direction === 'LONG') {
          return {
            time,
            position: 'belowBar' as const,
            color: '#4CAF50',
            shape: 'arrowUp' as const,
            text: '',
          };
        } else if (item.direction === 'SHORT') {
          return {
            time,
            position: 'aboveBar' as const,
            color: '#F44336',
            shape: 'arrowDown' as const,
            text: '',
          };
        } else if (item.direction === 'None') {
          return {
            time,
            position: 'inBar' as const,
            color: '#FFC107',
            shape: 'circle' as const,
            text: '',
          };
        }
        return null;
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null);

    if (markers.length > 0) {
      candlestickSeries.setMarkers(markers);
    }

    // Add support/resistance levels with proper types
    deduplicatedData.forEach((item: StockData) => {
      const itemTime = (new Date(item.date).getTime() / 1000) as UTCTimestamp;
      if (item.support && item.support.length > 0) {
        try {
          const supportValues: number[] = JSON.parse(item.support.replace(/'/g, '"'));
          if (supportValues.length > 0) {
            const minSupport = Math.min(...supportValues);
            const maxSupport = Math.max(...supportValues);
            const supportSeries = chart.addAreaSeries({
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              lineColor: 'transparent',
              topColor: 'rgba(76, 175, 80, 0.1)',
              bottomColor: 'rgba(76, 175, 80, 0.1)',
            });
            supportSeries.setData([
              { time: itemTime, value: minSupport },
              { time: itemTime, value: maxSupport }
            ]);
          }
        } catch (e) {}
      }

      if (item.resistance && item.resistance.length > 0) {
        try {
          const resistanceValues: number[] = JSON.parse(item.resistance.replace(/'/g, '"'));
          if (resistanceValues.length > 0) {
            const minResistance = Math.min(...resistanceValues);
            const maxResistance = Math.max(...resistanceValues);
            const resistanceSeries = chart.addAreaSeries({
              lastValueVisible: false,
              crosshairMarkerVisible: false,
              lineColor: 'transparent',
              topColor: 'rgba(244, 67, 54, 0.1)',
              bottomColor: 'rgba(244, 67, 54, 0.1)',
            });
            resistanceSeries.setData([
              { time: itemTime, value: minResistance },
              { time: itemTime, value: maxResistance }
            ]);
          }
        } catch (e) {}
      }
    });

    // Fit content and add resize handler
    chart.timeScale().fitContent();
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data]);

  return (
    <div className="w-full h-full">
      <div className="mb-3 p-2 bg-[#1e1e30] rounded-lg flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-300 mr-2">Indicators:</span>
        
        <button
          onClick={() => toggleIndicator('sma')}
          className={`flex items-center px-2 py-1 rounded text-xs ${
            indicators.sma ? 'bg-blue-600 text-white' : 'bg-[#181926] text-gray-300'
          }`}
        >
          <TrendingUp size={14} className="mr-1" />
          SMA
        </button>
        
        <button
          onClick={() => toggleIndicator('ema')}
          className={`flex items-center px-2 py-1 rounded text-xs ${
            indicators.ema ? 'bg-orange-600 text-white' : 'bg-[#181926] text-gray-300'
          }`}
        >
          <TrendingUp size={14} className="mr-1" />
          EMA
        </button>
        
        <button
          onClick={() => toggleIndicator('bollinger')}
          className={`flex items-center px-2 py-1 rounded text-xs ${
            indicators.bollinger ? 'bg-purple-600 text-white' : 'bg-[#181926] text-gray-300'
          }`}
        >
          <Layers size={14} className="mr-1" />
          Bollinger
        </button>
        
        <button
          onClick={() => toggleIndicator('rsi')}
          className={`flex items-center px-2 py-1 rounded text-xs ${
            indicators.rsi ? 'bg-pink-600 text-white' : 'bg-[#181926] text-gray-300'
          }`}
        >
          <Activity size={14} className="mr-1" />
          RSI
        </button>
        
        <button
          onClick={() => toggleIndicator('macd')}
          className={`flex items-center px-2 py-1 rounded text-xs ${
            indicators.macd ? 'bg-green-600 text-white' : 'bg-[#181926] text-gray-300'
          }`}
        >
          <BarChart2 size={14} className="mr-1" />
          MACD
        </button>
        
        <button
          onClick={() => toggleIndicator('volume')}
          className={`flex items-center px-2 py-1 rounded text-xs ${
            indicators.volume ? 'bg-gray-600 text-white' : 'bg-[#181926] text-gray-300'
          }`}
        >
          <BarChart size={14} className="mr-1" />
          Volume
        </button>
      </div>
      
      <div 
        ref={chartContainerRef} 
        className="w-full h-[500px] rounded-lg bg-[#1e1e30] text-[#d1d4dc]"
      />
    </div>
  );
};

export default ChartComponent;