import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface DateRangeSelectorProps {
  dateRange: [Date, Date];
  setDateRange: React.Dispatch<React.SetStateAction<[Date, Date]>>;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ dateRange, setDateRange }) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse date and ensure it's valid
    const newStartDate = new Date(e.target.value);
    if (isNaN(newStartDate.getTime())) return;
    
    // Ensure start date isn't after end date
    const endDate = dateRange[1];
    if (newStartDate > endDate) {
      // If new start date is after end date, set start date to end date
      setDateRange([endDate, endDate]);
    } else {
      setDateRange([newStartDate, endDate]);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse date and ensure it's valid
    const newEndDate = new Date(e.target.value);
    if (isNaN(newEndDate.getTime())) return;
    
    // Ensure end date isn't before start date
    const startDate = dateRange[0];
    if (newEndDate < startDate) {
      // If new end date is before start date, set end date to start date
      setDateRange([startDate, startDate]);
    } else {
      setDateRange([startDate, newEndDate]);
    }
  };

  const setPresetRange = (months: number) => {
    const endDate = new Date(); // Today
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);
    
    // Set time to start/end of day for more precise filtering
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Log the range being set
    console.log(`Setting preset range for ${months} months:`, [startDate.toLocaleDateString(), endDate.toLocaleDateString()]);
    
    // Update the date range
    setDateRange([startDate, endDate]);
  };
  
  // Function to handle YTD (Year-to-Date)
  const setYTD = () => {
    const endDate = new Date(); // Today
    const startDate = new Date(endDate.getFullYear(), 0, 1); // Jan 1 of current year
    
    // Set time to start/end of day for more precise filtering
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Log the range being set
    console.log('Setting YTD range:', [startDate.toLocaleDateString(), endDate.toLocaleDateString()]);
    
    // Update the date range
    setDateRange([startDate, endDate]);
  };

  return (
    <div className="bg-[#23243a] p-4 rounded-lg shadow-lg border border-[#23243a] text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <Calendar className="text-blue-400" size={20} />
          <h2 className="text-lg font-semibold text-gray-100">Date Range</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            className="px-3 py-1 text-sm bg-[#181926] hover:bg-blue-900 text-gray-100 border border-[#23243a] rounded-md transition-colors"
            onClick={() => setPresetRange(1)}
          >
            1M
          </button>
          <button 
            className="px-3 py-1 text-sm bg-[#181926] hover:bg-blue-900 text-gray-100 border border-[#23243a] rounded-md transition-colors"
            onClick={() => setPresetRange(3)}
          >
            3M
          </button>
          <button 
            className="px-3 py-1 text-sm bg-[#181926] hover:bg-blue-900 text-gray-100 border border-[#23243a] rounded-md transition-colors"
            onClick={() => setPresetRange(6)}
          >
            6M
          </button>
          <button 
            className="px-3 py-1 text-sm bg-[#181926] hover:bg-blue-900 text-gray-100 border border-[#23243a] rounded-md transition-colors"
            onClick={() => setPresetRange(12)}
          >
            1Y
          </button>
          <button 
            className="px-3 py-1 text-sm bg-[#181926] hover:bg-blue-900 text-gray-100 border border-[#23243a] rounded-md transition-colors"
            onClick={setYTD}
          >
            YTD
          </button>
        </div>
        
        <div className="flex flex-wrap items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">From:</span>
            <input
              type="date"
              value={format(dateRange[0], 'yyyy-MM-dd')}
              onChange={handleStartDateChange}
              className="px-2 py-1 text-sm bg-[#181926] border border-[#23243a] text-gray-100 rounded-md focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">To:</span>
            <input
              type="date"
              value={format(dateRange[1], 'yyyy-MM-dd')}
              onChange={handleEndDateChange}
              className="px-2 py-1 text-sm bg-[#181926] border border-[#23243a] text-gray-100 rounded-md focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;