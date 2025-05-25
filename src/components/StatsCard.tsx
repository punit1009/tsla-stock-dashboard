import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import darkTheme from '../styles/theme';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change: string;
  isPositive: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, change, isPositive }) => {
  return (
    <div 
      style={{ 
        backgroundColor: darkTheme.background.surface, 
        borderColor: darkTheme.background.surface,
        color: darkTheme.text.primary
      }}
      className="p-4 rounded-xl shadow-lg transition-transform hover:scale-105 border"
    >
      <div className="flex justify-between items-start">
        <div>
          <p style={{ color: darkTheme.text.secondary }} className="text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div style={{ backgroundColor: darkTheme.background.surfaceAlt }} className="p-2 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {isPositive ? (
          <ArrowUpRight style={{ color: darkTheme.status.success }} className="mr-1" size={16} />
        ) : (
          <ArrowDownRight style={{ color: darkTheme.status.error }} className="mr-1" size={16} />
        )}
        <span style={{ color: isPositive ? darkTheme.status.success : darkTheme.status.error }} className="text-sm">
          {change}
        </span>
      </div>
    </div>
  );
};

export default StatsCard;