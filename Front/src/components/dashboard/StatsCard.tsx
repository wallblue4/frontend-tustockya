import React from 'react';
import { Card } from '../ui/Card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  period?: string;
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  period = 'vs last period',
  icon,
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className="h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
        <div className="flex items-end space-x-2">
          <p className="text-2xl font-bold text-primary">{value}</p>
          {change !== undefined && (
            <div 
              className={`flex items-center text-sm ${
                isPositive 
                  ? 'text-success' 
                  : isNegative 
                  ? 'text-error' 
                  : 'text-muted-foreground'
              }`}
            >
              {isPositive ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : isNegative ? (
                <ArrowDown className="h-3 w-3 mr-1" />
              ) : null}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        {period && change !== undefined && (
          <p className="mt-1 text-xs text-muted-foreground">{period}</p>
        )}
      </div>
    </Card>
  );
};