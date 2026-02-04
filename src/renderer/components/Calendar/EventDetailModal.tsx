import React from 'react';
import { X, MapPin, Clock, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import type { CalendarEvent, Task, ScheduledTask } from '../../types';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    extendedProps: {
      type: 'google' | 'scheduled';
      task?: Task;
      calendarEvent?: CalendarEvent;
      scheduledTask?: ScheduledTask;
    };
  } | null;
}

export function EventDetailModal({ isOpen, onClose, event }: EventDetailModalProps) {
  if (!isOpen || !event) return null;

  const { calendarEvent, task, scheduledTask } = event.extendedProps;
  const isGoogleEvent = event.extendedProps.type === 'google';

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full animate-scale-in">
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                {isGoogleEvent ? (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                    Google Calendar
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                    Scheduled Task
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {event.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(event.start, 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                </div>
              </div>
            </div>

            {/* Location (for Google events) */}
            {calendarEvent?.location && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {calendarEvent.location}
                </div>
              </div>
            )}

            {/* Description */}
            {(calendarEvent?.description || task?.description) && (
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {calendarEvent?.description || task?.description}
                </div>
              </div>
            )}

            {/* Task-specific info */}
            {task && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Mastery Level</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Level {task.masteryLevel}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Duration</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {task.estimatedDuration} min
                    </div>
                  </div>
                </div>

                {/* PDF Link */}
                {task.pdfLink && (
                  <a
                    href={task.pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <ExternalLink size={14} />
                    Open attached PDF
                  </a>
                )}
              </div>
            )}

            {/* Completion status */}
            {scheduledTask && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className={clsx(
                  'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm',
                  scheduledTask.completed
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                )}>
                  {scheduledTask.completed ? 'Completed' : 'Pending'}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
