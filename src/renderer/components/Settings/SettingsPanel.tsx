import React, { useState, useRef } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Clock,
  Calendar,
  Bell,
  Cloud,
  CloudOff,
  Palette,
  RefreshCw,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../store';
import { UrgencyLevelConfig } from './UrgencyLevelConfig';
import type { Settings } from '../../types';

export function SettingsPanel() {
  const {
    settings,
    updateSettings,
    theme,
    setTheme,
    isGoogleConnected,
    connectGoogle,
    disconnectGoogle,
    syncCalendar,
    isSyncing,
    exportData,
    importData,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateSettings(localSettings);
    setHasChanges(false);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importData(file);
      // Reset the input so the same file can be imported again
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Appearance */}
      <SettingsSection
        title="Appearance"
        icon={<Palette size={20} />}
        description="Customize the look and feel of the application"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Theme
          </label>
          <div className="flex gap-3">
            {[
              { value: 'light', label: 'Light', icon: <Sun size={18} /> },
              { value: 'dark', label: 'Dark', icon: <Moon size={18} /> },
              { value: 'system', label: 'System', icon: <Monitor size={18} /> },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value as 'light' | 'dark' | 'system')}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                  theme === value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Working Hours */}
      <SettingsSection
        title="Working Hours"
        icon={<Clock size={20} />}
        description="Set your preferred study hours for task scheduling"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time
            </label>
            <select
              value={localSettings.workingHoursStart}
              onChange={(e) =>
                handleChange('workingHoursStart', Number(e.target.value))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Time
            </label>
            <select
              value={localSettings.workingHoursEnd}
              onChange={(e) =>
                handleChange('workingHoursEnd', Number(e.target.value))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Buffer Time Between Events
          </label>
          <select
            value={localSettings.bufferMinutes}
            onChange={(e) =>
              handleChange('bufferMinutes', Number(e.target.value))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </div>
      </SettingsSection>

      {/* Google Calendar */}
      <SettingsSection
        title="Google Calendar"
        icon={<Calendar size={20} />}
        description="Connect your Google Calendar to sync events"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isGoogleConnected ? (
              <>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Cloud size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Connected
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Your calendar is synced
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <CloudOff size={20} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Not Connected
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Connect to sync your events
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {isGoogleConnected ? (
              <>
                <button
                  onClick={syncCalendar}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} className={clsx(isSyncing && 'animate-spin')} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={disconnectGoogle}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectGoogle}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

        {isGoogleConnected && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Auto-Sync Interval
            </label>
            <select
              value={localSettings.autoSyncInterval}
              onChange={(e) =>
                handleChange('autoSyncInterval', Number(e.target.value))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
            </select>
          </div>
        )}
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        title="Notifications"
        icon={<Bell size={20} />}
        description="Configure notification preferences"
      >
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700 dark:text-gray-300">
            Enable notifications
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={localSettings.notificationsEnabled}
              onChange={(e) =>
                handleChange('notificationsEnabled', e.target.checked)
              }
              className="sr-only"
            />
            <div
              className={clsx(
                'w-11 h-6 rounded-full transition-colors',
                localSettings.notificationsEnabled
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <div
                className={clsx(
                  'w-5 h-5 bg-white rounded-full shadow-md transform transition-transform',
                  localSettings.notificationsEnabled
                    ? 'translate-x-5'
                    : 'translate-x-0.5',
                  'mt-0.5'
                )}
              />
            </div>
          </div>
        </label>
      </SettingsSection>

      {/* Urgency Levels */}
      <SettingsSection
        title="Urgency Levels"
        icon={<Palette size={20} />}
        description="Customize the review intervals for each mastery level"
      >
        <UrgencyLevelConfig
          levels={localSettings.urgencyLevels}
          onChange={(levels) => handleChange('urgencyLevels', levels)}
        />
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection
        title="Data Management"
        icon={<Download size={20} />}
        description="Export or import your data"
      >
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download size={18} />
            Export Data
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload size={18} />
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </SettingsSection>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium shadow-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// Settings section wrapper
function SettingsSection({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {description}
      </p>
      {children}
    </div>
  );
}
