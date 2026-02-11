import React, { useState, useRef, useEffect } from 'react';
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
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Languages,
  ArrowDownCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../store';
import { UrgencyLevelConfig } from './UrgencyLevelConfig';
import { useTranslation } from '../../hooks/useTranslation';
import type { Settings, Language } from '../../types';

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

  const { t, language, setLanguage } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);

  // Update state
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'available' | 'downloaded' | 'up-to-date'>('idle');
  const [updateInfo, setUpdateInfo] = useState<{ version: string; releaseNotes?: string } | null>(null);

  // Check for Electron API
  const hasElectronAPI = typeof window !== 'undefined' && window.electronAPI;

  // Get current version from package.json (exposed via Electron)
  const currentVersion = '1.0.0'; // This could be fetched from electronAPI if exposed

  // Listen for update status changes
  useEffect(() => {
    if (!hasElectronAPI) return;

    const unsubscribe = window.electronAPI.updates.onStatus((status) => {
      if (status.status === 'checking') {
        setUpdateStatus('checking');
      } else if (status.status === 'available') {
        setUpdateStatus('available');
        setUpdateInfo(status.info as { version: string; releaseNotes?: string });
      } else if (status.status === 'not-available') {
        setUpdateStatus('up-to-date');
      } else if (status.status === 'downloading') {
        setUpdateStatus('downloading');
      } else if (status.status === 'downloaded') {
        setUpdateStatus('downloaded');
      }
    });

    return () => unsubscribe();
  }, [hasElectronAPI]);

  const handleCheckForUpdates = async () => {
    if (!hasElectronAPI) return;
    setUpdateStatus('checking');
    try {
      await window.electronAPI.updates.check();
    } catch (error) {
      setUpdateStatus('idle');
    }
  };

  const handleDownloadUpdate = async () => {
    if (!hasElectronAPI) return;
    setUpdateStatus('downloading');
    try {
      await window.electronAPI.updates.download();
    } catch (error) {
      setUpdateStatus('available');
    }
  };

  const handleInstallUpdate = async () => {
    if (!hasElectronAPI) return;
    await window.electronAPI.updates.install();
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setLocalSettings((prev) => ({ ...prev, language: newLang }));
  };

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
        title={t.settings.appearance}
        icon={<Palette size={20} />}
        description={t.settings.appearanceDesc}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t.settings.theme}
          </label>
          <div className="flex gap-3">
            {[
              { value: 'light', label: t.settings.light, icon: <Sun size={18} /> },
              { value: 'dark', label: t.settings.dark, icon: <Moon size={18} /> },
              { value: 'system', label: t.settings.system, icon: <Monitor size={18} /> },
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

      {/* Language */}
      <SettingsSection
        title={t.settings.language}
        icon={<Languages size={20} />}
        description={t.settings.languageDesc}
      >
        <div className="flex gap-3">
          {[
            { value: 'fr' as Language, label: t.settings.french, flag: '🇫🇷' },
            { value: 'en' as Language, label: t.settings.english, flag: '🇬🇧' },
          ].map(({ value, label, flag }) => (
            <button
              key={value}
              onClick={() => handleLanguageChange(value)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                language === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
              )}
            >
              <span className="text-lg">{flag}</span>
              {label}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Working Hours */}
      <SettingsSection
        title={t.settings.workingHours}
        icon={<Clock size={20} />}
        description={t.settings.workingHoursDesc}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settings.startTime}
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
              {t.settings.endTime}
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
            {t.settings.bufferTime}
          </label>
          <select
            value={localSettings.bufferMinutes}
            onChange={(e) =>
              handleChange('bufferMinutes', Number(e.target.value))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={5}>5 {t.settings.minutes}</option>
            <option value={10}>10 {t.settings.minutes}</option>
            <option value={15}>15 {t.settings.minutes}</option>
            <option value={30}>30 {t.settings.minutes}</option>
          </select>
        </div>
      </SettingsSection>

      {/* Google API Configuration */}
      <SettingsSection
        title={t.settings.googleApi}
        icon={<Key size={20} />}
        description={t.settings.googleApiDesc}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t.settings.googleApiInfo}{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-1"
              >
                {t.settings.googleConsole} <ExternalLink size={12} />
              </a>
              .
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settings.clientId}
            </label>
            <input
              type="text"
              value={localSettings.googleClientId || ''}
              onChange={(e) => handleChange('googleClientId', e.target.value)}
              placeholder="xxxxxxxxxx.apps.googleusercontent.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settings.clientSecret}
            </label>
            <div className="relative">
              <input
                type={showClientSecret ? 'text' : 'password'}
                value={localSettings.googleClientSecret || ''}
                onChange={(e) => handleChange('googleClientSecret', e.target.value)}
                placeholder="GOCSPX-xxxxxxxxxx"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowClientSecret(!showClientSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showClientSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.settings.credentialsStored}
          </p>
        </div>
      </SettingsSection>

      {/* Google Calendar */}
      <SettingsSection
        title={t.settings.googleCalendar}
        icon={<Calendar size={20} />}
        description={t.settings.googleCalendarDesc}
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
                    {t.settings.connectedStatus}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t.settings.calendarSynced}
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
                    {t.settings.notConnected}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t.settings.connectToSync}
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
                  {isSyncing ? t.header.syncing : t.settings.syncNow}
                </button>
                <button
                  onClick={disconnectGoogle}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  {t.settings.disconnect}
                </button>
              </>
            ) : (
              <button
                onClick={connectGoogle}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                {t.settings.connectGoogle}
              </button>
            )}
          </div>
        </div>

        {isGoogleConnected && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.settings.autoSync}
            </label>
            <select
              value={localSettings.autoSyncInterval}
              onChange={(e) =>
                handleChange('autoSyncInterval', Number(e.target.value))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={5}>{t.settings.every} 5 {t.settings.minutes}</option>
              <option value={15}>{t.settings.every} 15 {t.settings.minutes}</option>
              <option value={30}>{t.settings.every} 30 {t.settings.minutes}</option>
              <option value={60}>{t.settings.everyHour}</option>
            </select>
          </div>
        )}
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        title={t.settings.notifications}
        icon={<Bell size={20} />}
        description={t.settings.notificationsDesc}
      >
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-700 dark:text-gray-300">
            {t.settings.enableNotifications}
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
        title={t.settings.urgencyLevels}
        icon={<Palette size={20} />}
        description={t.settings.urgencyLevelsDesc}
      >
        <UrgencyLevelConfig
          levels={localSettings.urgencyLevels}
          onChange={(levels) => handleChange('urgencyLevels', levels)}
        />
      </SettingsSection>

      {/* Updates - Only show in Electron */}
      {hasElectronAPI && (
        <SettingsSection
          title={t.settings.updates}
          icon={<ArrowDownCircle size={20} />}
          description={t.settings.updatesDesc}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {updateStatus === 'up-to-date' && (
                <>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t.settings.upToDate}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t.settings.currentVersion}: {currentVersion}
                    </div>
                  </div>
                </>
              )}
              {(updateStatus === 'available' || updateStatus === 'downloaded') && updateInfo && (
                <>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <ArrowDownCircle size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t.settings.updateAvailable}: v{updateInfo.version}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t.settings.currentVersion}: {currentVersion}
                    </div>
                  </div>
                </>
              )}
              {(updateStatus === 'idle' || updateStatus === 'checking' || updateStatus === 'downloading') && (
                <>
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    {updateStatus === 'checking' || updateStatus === 'downloading' ? (
                      <Loader2 size={20} className="text-gray-500 dark:text-gray-400 animate-spin" />
                    ) : (
                      <ArrowDownCircle size={20} className="text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {updateStatus === 'checking' && t.settings.checking}
                      {updateStatus === 'downloading' && t.settings.downloading}
                      {updateStatus === 'idle' && t.settings.currentVersion}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t.settings.version}: {currentVersion}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {updateStatus === 'idle' && (
                <button
                  onClick={handleCheckForUpdates}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  {t.settings.checkForUpdates}
                </button>
              )}
              {updateStatus === 'up-to-date' && (
                <button
                  onClick={handleCheckForUpdates}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  {t.settings.checkForUpdates}
                </button>
              )}
              {updateStatus === 'available' && (
                <button
                  onClick={handleDownloadUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                  {t.settings.downloadUpdate}
                </button>
              )}
              {updateStatus === 'downloaded' && (
                <button
                  onClick={handleInstallUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <CheckCircle size={16} />
                  {t.settings.installUpdate}
                </button>
              )}
            </div>
          </div>
        </SettingsSection>
      )}

      {/* Data Management */}
      <SettingsSection
        title={t.settings.dataManagement}
        icon={<Download size={20} />}
        description={t.settings.dataManagementDesc}
      >
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download size={18} />
            {t.settings.exportData}
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload size={18} />
            {t.settings.importData}
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
            {t.settings.saveChanges}
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
