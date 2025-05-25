import React, { useEffect, useState } from 'react';
import ChartComponent from './ChartComponent';
import DateRangeSelector from './DateRangeSelector';
import StatsCard from './StatsCard';
import { StockData } from '../types';
import { fetchStockData } from '../services/dataService';
import { calculateStats } from '../utils/stats';
import { TrendingUp, BarChart, Activity } from 'lucide-react';
import darkTheme from '../styles/theme';

const Dashboard: React.FC = () => {
  // We now directly use filteredData since we're filtering at the API level
  const [filteredData, setFilteredData] = useState<StockData[]>([]);
  const [stats, setStats] = useState({
    bullish: 0,
    bearish: 0,
    neutral: 0,
    avgVolume: 0,
    lastPrice: 0,
    volume: 0,
    change: 0
  });

  // Set default date range
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date(new Date().getFullYear(), 0, 1), // Jan 1 of current year
    new Date() // Today
  ]);

  // Load data when date range changes
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(`Loading data for date range: ${dateRange[0].toISOString().split('T')[0]} to ${dateRange[1].toISOString().split('T')[0]}`);
        
        // Format dates for API call
        const startDateStr = dateRange[0].toISOString().split('T')[0];
        const endDateStr = dateRange[1].toISOString().split('T')[0];
        
        // Fetch data with date range filtering applied at the API level
        const data = await fetchStockData(startDateStr, endDateStr);
        if (!data || data.length === 0) {
          console.warn(`No data returned from API for range: ${startDateStr} to ${endDateStr}`);
          return;
        }
        
        console.log(`Received ${data.length} records for date range ${startDateStr} to ${endDateStr}`);
        
        // Ensure data is properly sorted by date
        const sortedData = [...data].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Set filtered data directly since we've already filtered at the API level
        setFilteredData(sortedData);
        
        // Calculate and set statistics
        const calculatedStats = calculateStats(sortedData);
        
        // Get latest values for price, volume, and daily change
        if (sortedData.length > 0) {
          const latest = sortedData[sortedData.length - 1];
          const previous = sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;
          
          // Force a complete update by creating a new object instead of using spread
          const newStats = {
            bullish: calculatedStats.bullish,
            bearish: calculatedStats.bearish,
            neutral: calculatedStats.neutral,
            avgVolume: calculatedStats.avgVolume,
            lastPrice: latest.close,
            volume: latest.volume,
            change: previous ? ((latest.close - previous.close) / previous.close * 100) : 0
          };
          
          // Update stats with the new object to ensure React detects the change
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error loading stock data:', error);
      }
    };
    
    loadData();
  }, [dateRange]); // Re-fetch data when date range changes







  return (
    <div className="h-full" style={{ backgroundColor: darkTheme.background.primary, color: darkTheme.text.primary }}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div style={{ backgroundColor: darkTheme.background.surface }} className="rounded-2xl p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">TSLA</h2>
              <div className="grid grid-cols-2 gap-4">
                <div style={{ backgroundColor: darkTheme.background.surfaceAlt }} className="p-4 rounded-lg">
                  <h3 style={{ color: darkTheme.text.secondary }} className="text-sm">Last Price</h3>
                  <p className="text-2xl font-bold">${stats.lastPrice ? stats.lastPrice.toFixed(2) : '0.00'}</p>
                </div>
                <div style={{ backgroundColor: darkTheme.background.surfaceAlt }} className="p-4 rounded-lg">
                  <h3 style={{ color: darkTheme.text.secondary }} className="text-sm">Change</h3>
                  <p className="text-2xl font-bold" style={{ color: stats.change > 0 ? darkTheme.status.success : stats.change < 0 ? darkTheme.status.error : darkTheme.text.muted }}>
                    {stats.change ? `${stats.change.toFixed(2)}%` : '+0.00%'}
                  </p>
                </div>
              </div>
              <div style={{ backgroundColor: darkTheme.background.surfaceAlt }} className="p-4 rounded-lg">
                <h3 style={{ color: darkTheme.text.secondary }} className="text-sm">Volume</h3>
                <p className="text-xl font-semibold">{stats.volume ? stats.volume.toLocaleString() : '0'}</p>
              </div>
              <div className="space-y-4">
                <div style={{ backgroundColor: darkTheme.background.surfaceAlt }} className="p-4 rounded-lg">
                  <h3 style={{ color: darkTheme.text.secondary }} className="text-sm mb-3">Technical Indicators</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatsCard
                      title="Bullish Days"
                      value={`${stats.bullish}`}
                      icon={<TrendingUp size={20} style={{ color: darkTheme.status.success }} />}
                      change="Days with positive returns"
                      isPositive={true}
                    />
                    <StatsCard
                      title="Bearish Days"
                      value={`${stats.bearish}`}
                      icon={<TrendingUp size={20} style={{ color: darkTheme.status.error }} className="transform rotate-180" />}
                      change="Days with negative returns"
                      isPositive={false}
                    />
                    <StatsCard
                      title="Neutral Days"
                      value={`${stats.neutral}`}
                      icon={<Activity size={20} style={{ color: darkTheme.text.muted }} />}
                      change="Days with no change"
                      isPositive={true}
                    />
                    <StatsCard
                      title="Avg Volume"
                      value={stats.avgVolume ? stats.avgVolume.toLocaleString() : '0'}
                      icon={<BarChart size={20} style={{ color: darkTheme.accent.blue }} />}
                      change="Average trading volume"
                      isPositive={true}
                    />
                  </div>
                </div>
                <div style={{ backgroundColor: darkTheme.background.surfaceAlt }} className="p-4 rounded-lg">
                  <h3 style={{ color: darkTheme.text.secondary }} className="text-sm">Recent News</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span style={{ color: darkTheme.text.secondary }} className="text-sm">•</span>
                      <span className="ml-2 text-sm">Tesla announces new battery technology</span>
                    </div>
                    <div className="flex items-center">
                      <span style={{ color: darkTheme.text.secondary }} className="text-sm">•</span>
                      <span className="ml-2 text-sm">Production increases at Gigafactory</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chart */}
          <div style={{ backgroundColor: darkTheme.background.surface }} className="col-span-2 rounded-2xl p-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h2 className="text-xl font-semibold">Price Chart</h2>
                  <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setDateRange([new Date(Date.now() - 86400000), new Date()])} 
                    style={{ color: darkTheme.text.secondary, backgroundColor: darkTheme.background.surfaceAlt }}
                    className="text-sm px-2 py-1 rounded hover:opacity-80"
                  >1D</button>
                  <button 
                    onClick={() => setDateRange([new Date(Date.now() - 432000000), new Date()])} 
                    style={{ color: darkTheme.text.secondary, backgroundColor: darkTheme.background.surfaceAlt }}
                    className="text-sm px-2 py-1 rounded hover:opacity-80"
                  >5D</button>
                  <button 
                    onClick={() => setDateRange([new Date(Date.now() - 2592000000), new Date()])} 
                    style={{ color: darkTheme.text.secondary, backgroundColor: darkTheme.background.surfaceAlt }}
                    className="text-sm px-2 py-1 rounded hover:opacity-80"
                  >1M</button>
                  <button 
                    onClick={() => setDateRange([new Date(Date.now() - 7776000000), new Date()])} 
                    style={{ color: darkTheme.text.secondary, backgroundColor: darkTheme.background.surfaceAlt }}
                    className="text-sm px-2 py-1 rounded hover:opacity-80"
                  >3M</button>
                  <button 
                    onClick={() => setDateRange([new Date(Date.now() - 31536000000), new Date()])} 
                    style={{ color: darkTheme.text.secondary, backgroundColor: darkTheme.background.surfaceAlt }}
                    className="text-sm px-2 py-1 rounded hover:opacity-80"
                  >1Y</button>
                  <button 
                    onClick={() => setDateRange([new Date(2023, 0, 1), new Date(2023, 11, 31)])} 
                    style={{ color: darkTheme.text.secondary, backgroundColor: darkTheme.background.surfaceAlt }}
                    className="text-sm px-2 py-1 rounded hover:opacity-80"
                  >MAX</button>
                </div>
              </div>
              <div style={{ backgroundColor: darkTheme.background.surfaceAlt }} className="rounded-xl p-4">
                <ChartComponent data={filteredData} />
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="bg-[#23243a] rounded-2xl p-6">
            <div className="space-y-4">
              <div className="bg-[#282a3a] p-4 rounded-lg">
                <h3 className="text-sm text-gray-400">AI Analysis</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Use the chat interface below to analyze stock trends and get insights.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
