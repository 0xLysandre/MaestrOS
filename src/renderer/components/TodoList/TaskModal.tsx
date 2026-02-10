import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  FileText,
  Link,
  Tag,
  Zap,
  CalendarPlus,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { clsx } from 'clsx';
import { useStore } from '../../store';
import { useTranslation } from '../../hooks/useTranslation';
import { UrgencyBadge } from './UrgencyBadge';
import { TimeSlotSuggester } from '../Scheduler/TimeSlotSuggester';
import type { Task, MasteryLevel, CreateTaskDTO, UpdateTaskDTO } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function TaskModal({ isOpen, onClose, task }: TaskModalProps) {
  const { createTask, updateTask, scheduleTask, findAvailableSlots } = useStore();
  const { t } = useTranslation();

  const MASTERY_LEVELS: { level: MasteryLevel; nameKey: 'critical' | 'urgent' | 'deadline' | 'good' | 'mastered' }[] = [
    { level: 1, nameKey: 'critical' },
    { level: 2, nameKey: 'urgent' },
    { level: 3, nameKey: 'deadline' },
    { level: 4, nameKey: 'good' },
    { level: 5, nameKey: 'mastered' },
  ];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    masteryLevel: 3 as MasteryLevel,
    estimatedDuration: 30,
    customDeadline: '',
    pdfLink: '',
    notes: '',
    tags: '',
  });
  const [showScheduler, setShowScheduler] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState<{ start: Date; end: Date } | null>(null);

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          masteryLevel: task.masteryLevel,
          estimatedDuration: task.estimatedDuration,
          customDeadline: task.customDeadline
            ? format(new Date(task.customDeadline), 'yyyy-MM-dd')
            : '',
          pdfLink: task.pdfLink || '',
          notes: task.notes || '',
          tags: task.tags?.join(', ') || '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          masteryLevel: 3,
          estimatedDuration: 30,
          customDeadline: '',
          pdfLink: '',
          notes: '',
          tags: '',
        });
      }
      setShowScheduler(false);
      setPendingSchedule(null);
    }
  }, [isOpen, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);

    const taskData: CreateTaskDTO = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      masteryLevel: formData.masteryLevel,
      estimatedDuration: formData.estimatedDuration,
      customDeadline: formData.customDeadline
        ? new Date(formData.customDeadline).toISOString()
        : undefined,
      pdfLink: formData.pdfLink.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (task) {
      await updateTask({ id: task.id, ...taskData });
    } else {
      const newTask = await createTask(taskData);
      // If user selected a time slot, schedule the newly created task
      if (newTask && pendingSchedule) {
        await scheduleTask(
          newTask.id,
          pendingSchedule.start.toISOString(),
          pendingSchedule.end.toISOString()
        );
      }
    }

    setIsSubmitting(false);
    onClose();
  };

  const handleSchedule = async (start: Date, end: Date) => {
    if (task) {
      // Existing task: schedule immediately
      await scheduleTask(task.id, start.toISOString(), end.toISOString());
      setShowScheduler(false);
    } else {
      // New task: store the slot to schedule after creation
      setPendingSchedule({ start, end });
      setShowScheduler(false);
    }
  };

  // Create task and automatically schedule to best available slot
  const handleCreateAndSchedule = async () => {
    if (!formData.title.trim()) return;

    setIsSubmitting(true);

    const taskData: CreateTaskDTO = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      masteryLevel: formData.masteryLevel,
      estimatedDuration: formData.estimatedDuration,
      customDeadline: formData.customDeadline
        ? new Date(formData.customDeadline).toISOString()
        : undefined,
      pdfLink: formData.pdfLink.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    // Create the task first
    const newTask = await createTask(taskData);

    if (newTask) {
      // Find the best available slot
      const startDate = new Date();
      const endDate = addDays(startDate, 7);
      const slots = await findAvailableSlots(
        formData.estimatedDuration,
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (slots.length > 0) {
        // Schedule to the best (first) slot
        const bestSlot = slots[0];
        await scheduleTask(
          newTask.id,
          bestSlot.start instanceof Date ? bestSlot.start.toISOString() : bestSlot.start,
          bestSlot.end instanceof Date ? bestSlot.end.toISOString() : bestSlot.end
        );
      }
    }

    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {task ? t.common.edit : t.tasks.create}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.tasks.title} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Review Cardiology Chapter 5"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FileText size={14} className="inline mr-1" />
                {t.tasks.description}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Add details about this task..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Mastery Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Zap size={14} className="inline mr-1" />
                {t.tasks.masteryLevel}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MASTERY_LEVELS.map(({ level, nameKey }) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, masteryLevel: level }))
                    }
                    className={clsx(
                      'p-2 rounded-lg border-2 transition-all text-center',
                      formData.masteryLevel === level
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    )}
                  >
                    <UrgencyBadge level={level} size="sm" />
                    <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                      {t.mastery[nameKey]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration and Deadline */}
            <div className="grid grid-cols-2 gap-4">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  {t.tasks.duration}
                </label>
                <select
                  value={formData.estimatedDuration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estimatedDuration: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>

              {/* Custom Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  {t.tasks.deadline}
                </label>
                <input
                  type="date"
                  value={formData.customDeadline}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customDeadline: e.target.value,
                    }))
                  }
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* PDF Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Link size={14} className="inline mr-1" />
                {t.tasks.pdfLink}
              </label>
              <input
                type="url"
                value={formData.pdfLink}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pdfLink: e.target.value }))
                }
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.tasks.notes}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Tag size={14} className="inline mr-1" />
                {t.tasks.tags}
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="cardiology, anatomy, exam prep (comma separated)"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Time Slot Suggester */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowScheduler(!showScheduler)}
                className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Calendar size={16} />
                {showScheduler ? 'Hide scheduler' : pendingSchedule ? 'Change scheduled time' : 'Schedule this task'}
              </button>

              {pendingSchedule && !showScheduler && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  Scheduled for: {format(pendingSchedule.start, 'MMM d, h:mm a')} - {format(pendingSchedule.end, 'h:mm a')}
                </div>
              )}

              {showScheduler && (
                <div className="mt-4">
                  <TimeSlotSuggester
                    duration={formData.estimatedDuration}
                    onSelectSlot={handleSchedule}
                  />
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t.tasks.cancel}
            </button>
            {!task && (
              <button
                type="button"
                onClick={handleCreateAndSchedule}
                disabled={isSubmitting || !formData.title.trim()}
                className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CalendarPlus size={16} />
                {t.tasks.createAndSchedule}
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title.trim()}
              className="px-4 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {task ? t.tasks.update : t.tasks.create}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
