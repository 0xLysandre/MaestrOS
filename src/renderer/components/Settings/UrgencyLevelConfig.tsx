import React from 'react';
import { clsx } from 'clsx';
import type { UrgencyLevelConfig as UrgencyLevel, MasteryLevel } from '../../types';

interface UrgencyLevelConfigProps {
  levels: UrgencyLevel[];
  onChange: (levels: UrgencyLevel[]) => void;
}

const LEVEL_NAMES: Record<MasteryLevel, string> = {
  1: 'Critical',
  2: 'Urgent',
  3: 'Deadline',
  4: 'Good',
  5: 'Mastered',
};

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export function UrgencyLevelConfig({ levels, onChange }: UrgencyLevelConfigProps) {
  const handleIntervalChange = (level: MasteryLevel, days: number) => {
    const updatedLevels = levels.map((l) =>
      l.level === level ? { ...l, daysInterval: days } : l
    );
    onChange(updatedLevels);
  };

  const handleColorChange = (level: MasteryLevel, color: string) => {
    const updatedLevels = levels.map((l) =>
      l.level === level ? { ...l, color } : l
    );
    onChange(updatedLevels);
  };

  const handleNameChange = (level: MasteryLevel, name: string) => {
    const updatedLevels = levels.map((l) =>
      l.level === level ? { ...l, name } : l
    );
    onChange(updatedLevels);
  };

  return (
    <div className="space-y-4">
      {levels.map((levelConfig) => (
        <div
          key={levelConfig.level}
          className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          {/* Level indicator */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: levelConfig.color }}
          >
            {levelConfig.level}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={levelConfig.name}
              onChange={(e) =>
                handleNameChange(levelConfig.level, e.target.value)
              }
              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={LEVEL_NAMES[levelConfig.level]}
            />
          </div>

          {/* Days interval */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Review in
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={levelConfig.daysInterval}
              onChange={(e) =>
                handleIntervalChange(
                  levelConfig.level,
                  Math.max(1, Math.min(365, Number(e.target.value)))
                )
              }
              className="w-16 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              days
            </span>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-1">
            {PRESET_COLORS.slice(0, 4).map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(levelConfig.level, color)}
                className={clsx(
                  'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                  levelConfig.color === color
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={levelConfig.color}
              onChange={(e) =>
                handleColorChange(levelConfig.level, e.target.value)
              }
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
              title="Custom color"
            />
          </div>
        </div>
      ))}

      {/* Reset to defaults */}
      <button
        onClick={() => {
          const defaults: UrgencyLevel[] = [
            { level: 1, name: 'Critical', daysInterval: 1, color: '#ef4444' },
            { level: 2, name: 'Urgent', daysInterval: 3, color: '#f97316' },
            { level: 3, name: 'Deadline', daysInterval: 7, color: '#eab308' },
            { level: 4, name: 'Good', daysInterval: 7, color: '#22c55e' },
            { level: 5, name: 'Mastered', daysInterval: 21, color: '#06b6d4' },
          ];
          onChange(defaults);
        }}
        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
      >
        Reset to defaults
      </button>
    </div>
  );
}
