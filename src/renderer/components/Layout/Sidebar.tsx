import React from 'react';
import {
  Calendar,
  ListTodo,
  User,
  Settings,
  Plus,
  Flame,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../store';
import { useTranslation } from '../../hooks/useTranslation';
import type { ViewType } from '../../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onCreateTask: () => void;
}

interface NavItem {
  id: ViewType;
  labelKey: 'calendar' | 'tasks' | 'profile' | 'settings';
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'calendar', labelKey: 'calendar', icon: Calendar },
  { id: 'tasks', labelKey: 'tasks', icon: ListTodo },
  { id: 'profile', labelKey: 'profile', icon: User },
  { id: 'settings', labelKey: 'settings', icon: Settings },
];

export function Sidebar({ currentView, onViewChange, onCreateTask }: SidebarProps) {
  const { stats, tasks } = useStore();
  const { t } = useTranslation();

  // Check if running on macOS (Electron exposes this via navigator.platform)
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  // Get tasks due today or overdue
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const tasksDueToday = tasks.filter((task) => {
    if (task.isArchived) return false;
    const dueDate = new Date(task.nextReviewDate);
    return dueDate <= today;
  }).slice(0, 3); // Show max 3 tasks

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Drag region for macOS traffic lights */}
      {isMac && (
        <div
          className="h-12 flex-shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />
      )}

      {/* Logo */}
      <div className={`px-6 pb-4 ${isMac ? 'pt-2' : 'pt-6'} border-b border-gray-200 dark:border-gray-700`}>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          MaestrOS
        </h1>
      </div>

      {/* Create Task Button */}
      <div className="p-4">
        <button
          onClick={onCreateTask}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          <span>{t.nav.newTask}</span>
        </button>
      </div>

      {/* Due Today Section */}
      {tasksDueToday.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onViewChange('tasks')}
            className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{t.tasks.dueToday}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                <span className="text-xs font-bold">{tasksDueToday.length}</span>
                <ChevronRight size={14} />
              </div>
            </div>
            <div className="space-y-1">
              {tasksDueToday.map((task) => (
                <div
                  key={task.id}
                  className="text-xs text-amber-800 dark:text-amber-300 truncate"
                >
                  • {task.title}
                </div>
              ))}
            </div>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{t.nav[item.labelKey]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Streak Display */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="streak-fire">
              <Flame size={32} />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <div className="text-sm opacity-90">{t.profile.currentStreak}</div>
            </div>
          </div>
          {stats.longestStreak > 0 && (
            <div className="mt-2 text-xs opacity-75">
              {t.profile.longestStreak}: {stats.longestStreak} {t.profile.days}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 pb-4">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t.profile.tasksCompleted}
          </div>
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {stats.totalTasksCompleted}
          </div>
        </div>
      </div>
    </aside>
  );
}
