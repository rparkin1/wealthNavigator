/**
 * ThreadSidebar Component
 *
 * Manages conversation threads with date-based categorization,
 * search, and thread operations (create, select, delete).
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getCategoryIcon, type GoalCategory } from '../../utils/icons';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  goalTypes: string[];
  messageCount?: number;
  preview?: string;
}

interface ThreadSidebarProps {
  threads: Thread[];
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onSearch?: (query: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ThreadSidebar({
  threads,
  currentThreadId,
  onThreadSelect,
  onNewThread,
  onDeleteThread,
  onSearch,
  isCollapsed = false,
  onToggleCollapse,
}: ThreadSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['today', 'yesterday', 'past_7_days'])
  );

  // Filter threads based on search query
  const filteredThreads = searchQuery
    ? threads.filter(
        (thread) =>
          thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.preview?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads;

  // Categorize threads by date
  const categorizeThreads = () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    const categories: Record<string, Thread[]> = {
      today: [],
      yesterday: [],
      past_7_days: [],
      past_30_days: [],
      older: [],
    };

    filteredThreads.forEach((thread) => {
      const age = now - thread.updatedAt;

      if (age < oneDayMs) {
        categories.today.push(thread);
      } else if (age < 2 * oneDayMs) {
        categories.yesterday.push(thread);
      } else if (age < sevenDaysMs) {
        categories.past_7_days.push(thread);
      } else if (age < thirtyDaysMs) {
        categories.past_30_days.push(thread);
      } else {
        categories.older.push(thread);
      }
    });

    // Sort threads within each category by updatedAt (newest first)
    Object.keys(categories).forEach((key) => {
      categories[key].sort((a, b) => b.updatedAt - a.updatedAt);
    });

    return categories;
  };

  const categorizedThreads = categorizeThreads();

  const categoryLabels: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    past_7_days: 'Past 7 Days',
    past_30_days: 'Past 30 Days',
    older: 'Older',
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleDeleteClick = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    setDeletingThreadId(threadId);
  };

  const confirmDelete = () => {
    if (deletingThreadId) {
      onDeleteThread(deletingThreadId);
      setDeletingThreadId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingThreadId(null);
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-4"
          title="Expand sidebar"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={onNewThread}
          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
          title="New conversation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* New Thread Button */}
        <button
          onClick={onNewThread}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Conversation</span>
        </button>

        {/* Search Input */}
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-1">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Start a new conversation to begin'}
            </p>
          </div>
        ) : (
          Object.entries(categorizedThreads).map(
            ([category, categoryThreads]) =>
              categoryThreads.length > 0 && (
                <div key={category} className="mb-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {categoryLabels[category]}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">{categoryThreads.length}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedCategories.has(category) ? 'rotate-0' : '-rotate-90'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Thread Items */}
                  {expandedCategories.has(category) && (
                    <div className="space-y-1 px-2 pb-2">
                      {categoryThreads.map((thread) => (
                        <div
                          key={thread.id}
                          className="relative group"
                          onMouseEnter={() => setHoveredThreadId(thread.id)}
                          onMouseLeave={() => setHoveredThreadId(null)}
                        >
                          <button
                            onClick={() => onThreadSelect(thread.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                              currentThreadId === thread.id
                                ? 'bg-blue-50 text-blue-900'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <h3
                                  className={`text-sm font-medium truncate ${
                                    currentThreadId === thread.id ? 'text-blue-900' : 'text-gray-900'
                                  }`}
                                >
                                  {thread.title}
                                </h3>
                                {thread.preview && (
                                  <p className="text-xs text-gray-500 truncate mt-1">{thread.preview}</p>
                                )}
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {formatDistanceToNow(thread.updatedAt, { addSuffix: true })}
                                  </span>
                                  {thread.messageCount && thread.messageCount > 0 && (
                                    <>
                                      <span className="text-xs text-gray-300">•</span>
                                      <span className="text-xs text-gray-400">{thread.messageCount} messages</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Goal Type Badges */}
                              {thread.goalTypes && thread.goalTypes.length > 0 && (
                                <div className="flex-none flex gap-1">
                                  {thread.goalTypes.slice(0, 2).map((type) => {
                                    const IconComponent = getGoalTypeIconComponent(type);
                                    return (
                                      <span
                                        key={type}
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                                          currentThreadId === thread.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                        title={type}
                                      >
                                        <IconComponent className="w-3.5 h-3.5" />
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </button>

                          {/* Delete Button (appears on hover) */}
                          {hoveredThreadId === thread.id && currentThreadId !== thread.id && (
                            <button
                              onClick={(e) => handleDeleteClick(e, thread.id)}
                              className="absolute right-2 top-2 p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-md shadow-sm transition-colors"
                              title="Delete conversation"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingThreadId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Conversation?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This conversation will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={cancelDelete} className="btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/**
 * Get professional SVG icon component for goal type
 */
function getGoalTypeIconComponent(type: string): React.ComponentType<{ className?: string }> {
  const validCategories: GoalCategory[] = ['retirement', 'education', 'home', 'major_expense', 'emergency', 'legacy'];
  const category = type.toLowerCase() as GoalCategory;

  if (validCategories.includes(category)) {
    return getCategoryIcon(category);
  }
  return ChartBarIcon; // Default icon for unknown types
}
