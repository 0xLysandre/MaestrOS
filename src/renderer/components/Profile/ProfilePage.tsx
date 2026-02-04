import React from 'react';
import {
  Flame,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useStore } from '../../store';
import { StreakDisplay } from './StreakDisplay';
import { AchievementList } from './AchievementList';
import { StatsCard } from './StatsCard';

export function ProfilePage() {
  const { stats, tasks, achievements } = useStore();

  // Calculate task statistics
  const totalTasks = tasks.length;
  const tasksByLevel = {
    1: tasks.filter((t) => t.masteryLevel === 1).length,
    2: tasks.filter((t) => t.masteryLevel === 2).length,
    3: tasks.filter((t) => t.masteryLevel === 3).length,
    4: tasks.filter((t) => t.masteryLevel === 4).length,
    5: tasks.filter((t) => t.masteryLevel === 5).length,
  };
  const masteredTasks = tasksByLevel[5];
  const masteryPercentage = totalTasks > 0
    ? Math.round((masteredTasks / totalTasks) * 100)
    : 0;

  // Count unlocked achievements
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt).length;
  const totalAchievements = achievements.length;

  return (
    <div className="space-y-6">
      {/* Header with Streak */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Your Progress</h2>
            <p className="opacity-90">Keep up the great work!</p>
          </div>
          <StreakDisplay
            currentStreak={stats.currentStreak}
            longestStreak={stats.longestStreak}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tasks Completed"
          value={stats.totalTasksCompleted}
          icon={<Target size={24} />}
          color="blue"
        />
        <StatsCard
          title="Current Streak"
          value={`${stats.currentStreak} days`}
          icon={<Flame size={24} />}
          color="orange"
        />
        <StatsCard
          title="Topics Mastered"
          value={masteredTasks}
          subtitle={`${masteryPercentage}% of all tasks`}
          icon={<Star size={24} />}
          color="green"
        />
        <StatsCard
          title="Achievements"
          value={`${unlockedAchievements}/${totalAchievements}`}
          icon={<Trophy size={24} />}
          color="purple"
        />
      </div>

      {/* Mastery Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Mastery Distribution
        </h3>

        {totalTasks > 0 ? (
          <div className="space-y-3">
            {[
              { level: 1, name: 'Critical', color: 'bg-red-500' },
              { level: 2, name: 'Urgent', color: 'bg-orange-500' },
              { level: 3, name: 'Deadline', color: 'bg-yellow-500' },
              { level: 4, name: 'Good', color: 'bg-green-500' },
              { level: 5, name: 'Mastered', color: 'bg-cyan-500' },
            ].map(({ level, name, color }) => {
              const count = tasksByLevel[level as keyof typeof tasksByLevel];
              const percentage = Math.round((count / totalTasks) * 100);

              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                    Level {level}
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full transition-all duration-500', color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-sm text-right text-gray-600 dark:text-gray-400">
                    {count} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No tasks yet. Create your first task to see your progress!
          </p>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Trophy size={20} />
          Achievements
        </h3>
        <AchievementList achievements={achievements} />
      </div>

      {/* Activity Summary */}
      {stats.lastActivityDate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Activity Summary
          </h3>
          <div className="text-gray-600 dark:text-gray-400">
            <p>
              Last activity:{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {format(new Date(stats.lastActivityDate), 'EEEE, MMMM d, yyyy')}
              </span>
            </p>
            <p className="mt-2">
              Best streak:{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {stats.longestStreak} days
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
