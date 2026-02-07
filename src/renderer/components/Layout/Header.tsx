import React from 'react';
import {
  RefreshCw,
  Plus,
  Sun,
  Moon,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../store';
import type { ViewType } from '../../types';

interface HeaderProps {
  currentView: ViewType;
  onCreateTask: () => void;
  isGoogleConnected: boolean;
}

const viewTitles: Record<ViewType, string> = {
  calendar: 'Weekly Calendar',
  tasks: 'Task List',
  profile: 'Profile & Stats',
  settings: 'Settings',
};

export function Header({ currentView, onCreateTask, isGoogleConnected }: HeaderProps) {
  const { syncCalendar, isSyncing, theme, setTheme, connectGoogle } = useStore();

  const handleThemeToggle = () => {
    // Get the current actual appearance (accounting for system preference)
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Simple toggle: if currently dark, go light; if currently light, go dark
    if (isDarkMode) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={20} />;
    if (theme === 'light') return <Sun size={20} />;
    return <Sun size={20} className="opacity-50" />;
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
        {viewTitles[currentView]}
      </h2>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Google Calendar Status */}
        {currentView === 'calendar' && (
          <>
            {isGoogleConnected ? (
              <button
                onClick={syncCalendar}
                disabled={isSyncing}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                  'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                  isSyncing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <RefreshCw size={18} className={clsx(isSyncing && 'animate-spin')} />
                <span className="text-sm">{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            ) : (
              <button
                onClick={connectGoogle}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <CloudOff size={18} />
                <span className="text-sm">Connect Calendar</span>
              </button>
            )}

            {/* Connection indicator */}
            <div
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                isGoogleConnected
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              )}
            >
              {isGoogleConnected ? <Cloud size={14} /> : <CloudOff size={14} />}
              <span>{isGoogleConnected ? 'Connected' : 'Offline'}</span>
            </div>
          </>
        )}

        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={`Theme: ${theme}`}
        >
          {getThemeIcon()}
        </button>

        {/* Create Task (mobile/smaller screens) */}
        {(currentView === 'calendar' || currentView === 'tasks') && (
          <button
            onClick={onCreateTask}
            className="lg:hidden p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
