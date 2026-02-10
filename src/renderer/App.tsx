import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { WeeklyView } from './components/Calendar/WeeklyView';
import { TodoList } from './components/TodoList/TodoList';
import { ProfilePage } from './components/Profile/ProfilePage';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { TaskModal } from './components/TodoList/TaskModal';
import { useStore } from './store';
import type { ViewType, Task } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: Date; end: Date } | null>(null);

  const {
    theme,
    initializeApp,
    isLoading,
    isGoogleConnected,
  } = useStore();

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // Listen for notification events (Electron only)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Play notification sound
      const unsubscribeSound = window.electronAPI.notifications.onPlaySound(() => {
        // Play a notification sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 880; // A5 note
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      });

      // Navigate to tasks when notification is clicked
      const unsubscribeNavigate = window.electronAPI.notifications.onNavigateToTasks(() => {
        setCurrentView('tasks');
      });

      return () => {
        unsubscribeSound();
        unsubscribeNavigate();
      };
    }
  }, []);

  const handleCreateTask = (timeSlot?: { start: Date; end: Date }) => {
    setEditingTask(null);
    setSelectedTimeSlot(timeSlot || null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setSelectedTimeSlot(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'calendar':
        return (
          <WeeklyView
            onTaskClick={handleEditTask}
            onCreateTask={handleCreateTask}
          />
        );
      case 'tasks':
        return (
          <TodoList
            onEditTask={handleEditTask}
            onCreateTask={handleCreateTask}
          />
        );
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Medical Scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateTask={handleCreateTask}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          currentView={currentView}
          onCreateTask={handleCreateTask}
          isGoogleConnected={isGoogleConnected}
        />

        <main className="flex-1 overflow-auto p-6">
          {renderView()}
        </main>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        selectedTimeSlot={selectedTimeSlot}
      />

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'toast-container',
          duration: 4000,
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-color, #1f2937)',
          },
        }}
      />
    </div>
  );
}
