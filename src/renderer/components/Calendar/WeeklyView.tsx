import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useStore } from '../../store';
import { EventDetailModal } from './EventDetailModal';
import type { Task, CalendarEvent, ScheduledTask } from '../../types';

interface WeeklyViewProps {
  onTaskClick: (task: Task) => void;
  onCreateTask: () => void;
}

interface CalendarEventData {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  classNames?: string[];
  extendedProps: {
    type: 'google' | 'scheduled';
    task?: Task;
    calendarEvent?: CalendarEvent;
    scheduledTask?: ScheduledTask;
  };
}

const URGENCY_COLORS = {
  1: { bg: '#ef4444', border: '#dc2626' }, // Critical - Red
  2: { bg: '#f97316', border: '#ea580c' }, // Urgent - Orange
  3: { bg: '#eab308', border: '#ca8a04' }, // Deadline - Yellow
  4: { bg: '#22c55e', border: '#16a34a' }, // Good - Green
  5: { bg: '#06b6d4', border: '#0891b2' }, // Mastered - Cyan
};

export function WeeklyView({ onTaskClick, onCreateTask }: WeeklyViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    tasks,
    calendarEvents,
    scheduledTasks,
    fetchCalendarEvents,
    fetchScheduledTasks,
    updateScheduledTask,
    scheduleTask,
  } = useStore();

  // Fetch data when current date changes
  useEffect(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    fetchCalendarEvents(weekStart.toISOString(), weekEnd.toISOString());
    fetchScheduledTasks(weekStart.toISOString(), weekEnd.toISOString());
  }, [currentDate, fetchCalendarEvents, fetchScheduledTasks]);

  // Convert data to calendar events
  const calendarData: CalendarEventData[] = [
    // Google Calendar events
    ...calendarEvents.map((event) => ({
      id: `google-${event.id}`,
      title: event.title,
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      textColor: '#ffffff',
      classNames: ['google-event'],
      extendedProps: {
        type: 'google' as const,
        calendarEvent: event,
      },
    })),
    // Scheduled tasks
    ...scheduledTasks.map((scheduled) => {
      const task = tasks.find((t) => t.id === scheduled.taskId);
      const colors = task ? URGENCY_COLORS[task.masteryLevel] : URGENCY_COLORS[3];

      return {
        id: `scheduled-${scheduled.id}`,
        title: task?.title || 'Unknown Task',
        start: new Date(scheduled.scheduledStart),
        end: new Date(scheduled.scheduledEnd),
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: '#ffffff',
        classNames: [
          'scheduled-task',
          `urgency-${task?.masteryLevel || 3}`,
          scheduled.completed ? 'opacity-50' : '',
        ],
        extendedProps: {
          type: 'scheduled' as const,
          task,
          scheduledTask: scheduled,
        },
      };
    }),
  ];

  const handleEventClick = (info: { event: { extendedProps: CalendarEventData['extendedProps'] } } & CalendarEventData) => {
    const eventData = calendarData.find((e) => e.id === info.event.id);
    if (eventData) {
      if (eventData.extendedProps.type === 'scheduled' && eventData.extendedProps.task) {
        onTaskClick(eventData.extendedProps.task);
      } else {
        setSelectedEvent(eventData);
        setIsDetailModalOpen(true);
      }
    }
  };

  const handleEventDrop = async (info: {
    event: { id: string; start: Date | null; end: Date | null };
    revert: () => void;
  }) => {
    const eventId = info.event.id;

    if (eventId.startsWith('scheduled-')) {
      const scheduledId = eventId.replace('scheduled-', '');
      const start = info.event.start;
      const end = info.event.end;

      if (start && end) {
        const result = await updateScheduledTask(
          scheduledId,
          start.toISOString(),
          end.toISOString()
        );

        if (!result) {
          info.revert();
        }
      }
    } else {
      // Can't move Google Calendar events
      info.revert();
    }
  };

  const handleDateSelect = async (info: {
    start: Date;
    end: Date;
    allDay: boolean;
  }) => {
    if (!info.allDay) {
      // Could open a quick-schedule modal here
      // For now, just open the create task modal
      onCreateTask();
    }
  };

  const handleDatesSet = (dateInfo: { start: Date }) => {
    setCurrentDate(dateInfo.start);
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay,dayGridMonth',
        }}
        events={calendarData}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        select={handleDateSelect}
        datesSet={handleDatesSet}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        firstDay={1} // Monday
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        nowIndicator={true}
        height="100%"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        eventContent={(eventInfo) => (
          <div className="p-1 overflow-hidden">
            <div className="font-medium text-xs truncate">
              {eventInfo.event.title}
            </div>
            <div className="text-xs opacity-75">
              {format(eventInfo.event.start!, 'HH:mm')} - {format(eventInfo.event.end!, 'HH:mm')}
            </div>
          </div>
        )}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
