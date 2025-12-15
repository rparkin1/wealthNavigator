/**
 * ThreadSidebarRedesign Component
 *
 * Redesigned sidebar for managing conversation threads with date categorization,
 * search, and thread operations following the WealthNavigator UI redesign
 * design system.
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { ThreadSearchInput } from './ThreadSearchInput';
import { ThreadListItem } from './ThreadListItem';
import { ThreadCategorySection } from './ThreadCategorySection';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  categorizeThreads,
  filterThreads,
  categoryLabels,
  getCategoriesWithThreads,
  type ThreadCategory,
} from './utils/categorizeThreads';

interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  goalTypes: string[];
  messageCount?: number;
  preview?: string;
}

interface ThreadSidebarRedesignProps {
  threads: Thread[];
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onArchiveThread?: (threadId: string) => void;
  onSearch?: (query: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ThreadSidebarRedesign({
  threads,
  currentThreadId,
  onThreadSelect,
  onNewThread,
  onDeleteThread,
  onArchiveThread,
  onSearch,
  isCollapsed = false,
  onToggleCollapse,
}: ThreadSidebarRedesignProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<ThreadCategory>>(
    new Set(['today', 'yesterday', 'past_7_days'])
  );

  // Filter threads based on search query
  const filteredThreads = useMemo(
    () => filterThreads(threads, searchQuery),
    [threads, searchQuery]
  );

  // Categorize filtered threads by date
  const categorizedThreads = useMemo(
    () => categorizeThreads(filteredThreads),
    [filteredThreads]
  );

  // Get categories that have threads
  const categoriesWithThreads = getCategoriesWithThreads(categorizedThreads);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const toggleCategory = (category: ThreadCategory) => {
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

  const handleDeleteClick = (threadId: string) => {
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

  // Collapsed state
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-4"
          title="Expand sidebar"
          aria-label="Expand sidebar"
          aria-expanded="false"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          onClick={onNewThread}
          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
          title="New conversation"
          aria-label="New conversation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </aside>
    );
  }

  // Expanded state
  return (
    <aside
      className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden"
      aria-label="Conversation threads"
    >
      {/* Header */}
      <div className="flex-none p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              aria-expanded="true"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* New Thread Button */}
        <Button
          onClick={onNewThread}
          variant="primary"
          size="md"
          className="w-full"
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          New Conversation
        </Button>

        {/* Search Input */}
        <ThreadSearchInput
          value={searchQuery}
          onChange={handleSearch}
          className="mt-3"
        />
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <svg
              className="w-12 h-12 text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-1 font-medium">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Start a new conversation to begin'}
            </p>
          </div>
        ) : (
          categoriesWithThreads.map((category) => (
            <ThreadCategorySection
              key={category}
              category={category}
              label={categoryLabels[category]}
              threads={categorizedThreads[category]}
              isExpanded={expandedCategories.has(category)}
              onToggle={() => toggleCategory(category)}
            >
              {categorizedThreads[category].map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  isActive={currentThreadId === thread.id}
                  onSelect={onThreadSelect}
                  onDelete={handleDeleteClick}
                  onArchive={onArchiveThread}
                />
              ))}
            </ThreadCategorySection>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingThreadId && (
        <DeleteConfirmModal
          title="Delete Conversation?"
          message="This conversation will be permanently deleted. This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </aside>
  );
}
