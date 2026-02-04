import React from 'react';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'orange' | 'green' | 'purple' | 'red';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-500 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-800',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-500 dark:text-orange-400',
    border: 'border-orange-100 dark:border-orange-800',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-500 dark:text-green-400',
    border: 'border-green-100 dark:border-green-800',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-500 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-800',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-500 dark:text-red-400',
    border: 'border-red-100 dark:border-red-800',
  },
};

export function StatsCard({ title, value, subtitle, icon, color }: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={clsx(
      'rounded-xl border p-4 transition-shadow hover:shadow-md',
      colors.bg,
      colors.border
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={clsx('p-2 rounded-lg', colors.bg, colors.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
