import React, { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { Clock, Calendar, Star, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../store';
import type { TimeSlot } from '../../types';

interface TimeSlotSuggesterProps {
  duration: number;
  onSelectSlot: (start: Date, end: Date) => void;
}

export function TimeSlotSuggester({ duration, onSelectSlot }: TimeSlotSuggesterProps) {
  const { findAvailableSlots } = useStore();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    const loadSlots = async () => {
      setIsLoading(true);
      const startDate = new Date();
      const endDate = addDays(startDate, 7);

      const availableSlots = await findAvailableSlots(
        duration,
        startDate.toISOString(),
        endDate.toISOString()
      );

      setSlots(availableSlots);
      setIsLoading(false);
    };

    loadSlots();
  }, [duration, findAvailableSlots]);

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (selectedSlot) {
      const start = new Date(selectedSlot.start);
      const end = new Date(selectedSlot.end);
      onSelectSlot(start, end);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Finding available slots...
        </span>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No available time slots found for the next 7 days.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Try reducing the task duration or adjust your working hours in settings.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Suggested Time Slots ({slots.length} available)
      </h4>

      <div className="space-y-2 max-h-64 overflow-auto">
        {slots.slice(0, 5).map((slot, index) => {
          const start = new Date(slot.start);
          const end = new Date(slot.end);
          const isSelected = selectedSlot === slot;
          const isTop = index === 0;

          return (
            <button
              key={`${slot.start}-${slot.end}`}
              onClick={() => handleSelectSlot(slot)}
              className={clsx(
                'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              )}
            >
              {/* Best match indicator */}
              {isTop && (
                <div className="flex-shrink-0">
                  <Star
                    size={18}
                    className="text-yellow-500 fill-yellow-500"
                  />
                </div>
              )}

              {/* Slot details */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {format(start, 'EEEE, MMM d')}
                  </span>
                  {isTop && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                      Best match
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <Clock size={14} />
                  <span>
                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                  </span>
                  <span className="text-gray-400">({slot.durationMinutes} min)</span>
                </div>
              </div>

              {/* Score indicator */}
              {slot.score !== undefined && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Score
                  </div>
                  <div className={clsx(
                    'text-sm font-medium',
                    slot.score >= 70
                      ? 'text-green-600 dark:text-green-400'
                      : slot.score >= 40
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-600 dark:text-gray-400'
                  )}>
                    {slot.score}%
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      {selectedSlot && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            Schedule for {format(new Date(selectedSlot.start), 'EEE, MMM d')} at{' '}
            {format(new Date(selectedSlot.start), 'HH:mm')}
          </button>
        </div>
      )}
    </div>
  );
}
