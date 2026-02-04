import React from 'react';
import { clsx } from 'clsx';
import type { MasteryLevel } from '../../types';

interface UrgencyBadgeProps {
  level: MasteryLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const LEVEL_CONFIG: Record<
  MasteryLevel,
  { name: string; color: string; bgColor: string; borderColor: string }
> = {
  1: {
    name: 'Critical',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  2: {
    name: 'Urgent',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
  },
  3: {
    name: 'Deadline',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  4: {
    name: 'Good',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  5: {
    name: 'Mastered',
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
  },
};

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function UrgencyBadge({ level, size = 'md', showLabel = false }: UrgencyBadgeProps) {
  const config = LEVEL_CONFIG[level];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        config.color,
        config.bgColor,
        config.borderColor,
        SIZE_CLASSES[size]
      )}
    >
      <span className="font-bold">{level}</span>
      {showLabel && <span>{config.name}</span>}
    </span>
  );
}

// Simple dot indicator for compact displays
export function UrgencyDot({ level }: { level: MasteryLevel }) {
  const colors: Record<MasteryLevel, string> = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500',
    5: 'bg-cyan-500',
  };

  return (
    <span
      className={clsx('w-3 h-3 rounded-full inline-block', colors[level])}
      title={`Level ${level}: ${LEVEL_CONFIG[level].name}`}
    />
  );
}
