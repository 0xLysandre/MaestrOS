import React from 'react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import type { Achievement } from '../../types';

interface AchievementListProps {
  achievements: Achievement[];
}

export function AchievementList({ achievements }: AchievementListProps) {
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);
  const lockedAchievements = achievements.filter((a) => !a.unlockedAt);

  return (
    <div className="space-y-6">
      {/* Unlocked */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Unlocked ({unlockedAchievements.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlockedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {lockedAchievements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Locked ({lockedAchievements.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lockedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={false}
              />
            ))}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          No achievements available.
        </p>
      )}
    </div>
  );
}

function AchievementCard({
  achievement,
  unlocked,
}: {
  achievement: Achievement;
  unlocked: boolean;
}) {
  return (
    <div
      className={clsx(
        'relative rounded-lg border p-4 transition-all',
        unlocked
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800'
          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-60'
      )}
    >
      {/* Icon */}
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'text-3xl',
            !unlocked && 'grayscale opacity-50'
          )}
        >
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className={clsx(
            'font-medium truncate',
            unlocked
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400'
          )}>
            {achievement.title}
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {achievement.description}
          </p>
          {unlocked && achievement.unlockedAt && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Unlocked {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>

      {/* Unlocked badge */}
      {unlocked && (
        <div className="absolute -top-2 -right-2">
          <span className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg">
            ✓
          </span>
        </div>
      )}
    </div>
  );
}

// Compact achievement display for notifications
export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg">
      <span className="text-2xl">{achievement.icon}</span>
      <div>
        <div className="font-medium text-gray-900 dark:text-white text-sm">
          {achievement.title}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Achievement Unlocked!
        </div>
      </div>
    </div>
  );
}
