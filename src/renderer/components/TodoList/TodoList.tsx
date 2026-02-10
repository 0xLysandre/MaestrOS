import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SortAsc,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from '../../store';
import { useTranslation } from '../../hooks/useTranslation';
import { TaskItem } from './TaskItem';
import { UrgencyBadge } from './UrgencyBadge';
import type { Task, TaskSortOption, MasteryLevel } from '../../types';

interface TodoListProps {
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
}

export function TodoList({ onEditTask, onCreateTask }: TodoListProps) {
  const { tasks, completeTask, deleteTask } = useStore();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortOption>('urgency');
  const [filterLevels, setFilterLevels] = useState<MasteryLevel[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
    new Set([1, 2, 3, 4, 5])
  );

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((task) => !task.isArchived);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Level filter
    if (filterLevels.length > 0) {
      result = result.filter((task) => filterLevels.includes(task.masteryLevel));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          return a.masteryLevel - b.masteryLevel;
        case 'date':
          return (
            new Date(a.nextReviewDate).getTime() -
            new Date(b.nextReviewDate).getTime()
          );
        case 'created':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'duration':
          return a.estimatedDuration - b.estimatedDuration;
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, searchQuery, sortBy, filterLevels]);

  // Group tasks by mastery level
  const groupedTasks = useMemo(() => {
    const groups = new Map<number, Task[]>();
    for (let level = 1; level <= 5; level++) {
      groups.set(level, filteredTasks.filter((t) => t.masteryLevel === level));
    }
    return groups;
  }, [filteredTasks]);

  const toggleGroup = (level: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const toggleFilterLevel = (level: MasteryLevel) => {
    setFilterLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level]
    );
  };

  const handleComplete = async (task: Task, newLevel: number) => {
    await completeTask(task.id, newLevel);
  };

  const handleDelete = async (task: Task) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TaskSortOption)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="urgency">Sort by Urgency</option>
            <option value="date">Sort by Due Date</option>
            <option value="created">Sort by Created</option>
            <option value="duration">Sort by Duration</option>
          </select>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                filterLevels.length > 0
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filter</span>
              {filterLevels.length > 0 && (
                <span className="bg-primary-500 text-white text-xs px-1.5 rounded-full">
                  {filterLevels.length}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                {([1, 2, 3, 4, 5] as MasteryLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleFilterLevel(level)}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700',
                      filterLevels.includes(level) && 'bg-gray-100 dark:bg-gray-700'
                    )}
                  >
                    <UrgencyBadge level={level} size="sm" />
                    <span className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300">
                      Level {level}
                    </span>
                    {filterLevels.includes(level) && (
                      <span className="text-primary-500">✓</span>
                    )}
                  </button>
                ))}
                {filterLevels.length > 0 && (
                  <button
                    onClick={() => setFilterLevels([])}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2 border-t border-gray-200 dark:border-gray-700 mt-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Create button */}
          <button
            onClick={onCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{filteredTasks.length} tasks</span>
          <span>
            {filteredTasks.filter((t) => t.masteryLevel <= 2).length} urgent
          </span>
        </div>
      </div>

      {/* Task Groups */}
      <div className="flex-1 overflow-auto space-y-4">
        {([1, 2, 3, 4, 5] as MasteryLevel[]).map((level) => {
          const levelTasks = groupedTasks.get(level) || [];
          if (levelTasks.length === 0) return null;

          const isExpanded = expandedGroups.has(level);

          return (
            <div
              key={level}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(level)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UrgencyBadge level={level} />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Level {level}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({levelTasks.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>

              {/* Tasks */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {levelTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onEdit={() => onEditTask(task)}
                      onComplete={(newLevel) => handleComplete(task, newLevel)}
                      onDelete={() => handleDelete(task)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || filterLevels.length > 0
                ? 'No tasks match your filters'
                : 'No tasks yet'}
            </p>
            <button
              onClick={onCreateTask}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Create your first task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
