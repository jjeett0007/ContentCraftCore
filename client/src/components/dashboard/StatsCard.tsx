import React from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'primary' | 'secondary' | 'accent' | 'dark';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent',
    dark: 'bg-dark/10 text-dark'
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${colorClasses[color]}`}>
          <span className="material-icons">{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-lg font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
