import React from 'react';
import {
  Calendar,
  ListTodo,
  User,
  Settings,
  Plus,
  Flame,
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
  const { stats } = useStore();
  const { t } = useTranslation();

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span>MedScheduler</span>
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
