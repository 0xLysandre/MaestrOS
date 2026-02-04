import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { clsx } from 'clsx';
import { UrgencyBadge } from './UrgencyBadge';
import type { Task, MasteryLevel } from '../../types';

interface TaskItemProps {
  task: Task;
  onEdit: () => void;
  onComplete: (newLevel: number) => void;
  onDelete: () => void;
}

const LEVEL_NAMES: Record<MasteryLevel, string> = {
  1: 'Critical',
  2: 'Urgent',
  3: 'Deadline',
  4: 'Good',
  5: 'Mastered',
};

export function TaskItem({ task, onEdit, onComplete, onDelete }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCompleteMenu, setShowCompleteMenu] = useState(false);

  const reviewDate = new Date(task.nextReviewDate);
  const isOverdue = isPast(reviewDate) && !isToday(reviewDate);
  const isDueToday = isToday(reviewDate);

  return (
    <div
      className={clsx(
        'border-b border-gray-100 dark:border-gray-700 last:border-b-0',
        'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors'
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Complete button */}
        <div className="relative">
          <button
            onClick={() => setShowCompleteMenu(!showCompleteMenu)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-400 hover:text-green-500"
          >
            <CheckCircle size={20} />
          </button>

          {/* Complete menu */}
          {showCompleteMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowCompleteMenu(false)}
              />
              <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
                  Mark as completed with level:
                </div>
                {([1, 2, 3, 4, 5] as MasteryLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      onComplete(level);
                      setShowCompleteMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    <UrgencyBadge level={level} size="sm" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {LEVEL_NAMES[level]}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {task.title}
            </h4>
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {task.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-xs text-gray-400">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {task.estimatedDuration} min
            </span>
            <span
              className={clsx(
                'flex items-center gap-1',
                isOverdue && 'text-red-500',
                isDueToday && 'text-yellow-500'
              )}
            >
              <Calendar size={14} />
              {isOverdue
                ? 'Overdue'
                : isDueToday
                  ? 'Today'
                  : format(reviewDate, 'MMM d')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 transition-colors"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 ml-12">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {task.description}
              </p>
            )}

            {task.notes && (
              <div className="text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Notes:{' '}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {task.notes}
                </span>
              </div>
            )}

            {task.pdfLink && (
              <a
                href={task.pdfLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <ExternalLink size={14} />
                Open attached PDF
              </a>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={14} className="text-gray-400" />
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
              <span>Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
              {task.lastReviewedAt && (
                <span>
                  Last reviewed: {format(new Date(task.lastReviewedAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
