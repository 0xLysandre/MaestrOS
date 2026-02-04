import React from 'react';
import { Flame } from 'lucide-react';
import { clsx } from 'clsx';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  size = 'md',
}: StreakDisplayProps) {
  const sizeClasses = {
    sm: {
      container: 'p-3',
      icon: 24,
      number: 'text-2xl',
      label: 'text-xs',
    },
    md: {
      container: 'p-4',
      icon: 40,
      number: 'text-4xl',
      label: 'text-sm',
    },
    lg: {
      container: 'p-6',
      icon: 56,
      number: 'text-6xl',
      label: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  // Determine flame intensity based on streak
  const getFlameColor = () => {
    if (currentStreak >= 30) return 'text-yellow-300';
    if (currentStreak >= 14) return 'text-orange-300';
    if (currentStreak >= 7) return 'text-orange-400';
    return 'text-orange-200';
  };

  const isOnFire = currentStreak >= 7;

  return (
    <div className={clsx('bg-white/10 backdrop-blur rounded-xl', classes.container)}>
      <div className="flex items-center gap-3">
        <div className={clsx('relative', isOnFire && 'animate-pulse')}>
          <Flame
            size={classes.icon}
            className={clsx(getFlameColor(), 'drop-shadow-lg')}
            fill="currentColor"
          />
          {isOnFire && (
            <div className="absolute inset-0 animate-ping">
              <Flame
                size={classes.icon}
                className="text-yellow-500 opacity-50"
                fill="currentColor"
              />
            </div>
          )}
        </div>
        <div>
          <div className={clsx('font-bold leading-none', classes.number)}>
            {currentStreak}
          </div>
          <div className={clsx('opacity-90 mt-1', classes.label)}>
            Day Streak
          </div>
        </div>
      </div>

      {longestStreak > currentStreak && (
        <div className={clsx('mt-2 opacity-75', classes.label)}>
          Best: {longestStreak} days
        </div>
      )}

      {currentStreak === longestStreak && currentStreak > 0 && (
        <div className={clsx('mt-2 flex items-center gap-1', classes.label)}>
          <span className="text-yellow-300">★</span>
          <span>Personal best!</span>
        </div>
      )}
    </div>
  );
}

// Simple inline streak indicator
export function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm">
      <Flame size={14} className="fill-current" />
      {streak}
    </span>
  );
}
