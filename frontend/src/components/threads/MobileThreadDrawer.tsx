/**
 * MobileThreadDrawer Component
 *
 * Slide-out drawer for mobile thread navigation
 * Following WealthNavigator UI redesign design system
 */

import React, { useEffect, useState } from 'react';
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

interface MobileThreadDrawerProps {
  threads: Thread[];
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onArchiveThread?: (threadId: string) => void;
  onSearch?: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileThreadDrawer({
  threads,
  currentThreadId,
  onThreadSelect,
  onNewThread,
  onDeleteThread,
  onArchiveThread,
  onSearch,
  isOpen,
  onClose,
}: MobileThreadDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<ThreadCategory>>(
    new Set(['today', 'yesterday', 'past_7_days'])
  );

  // Filter and categorize threads
  const filteredThreads = React.useMemo(
    () => filterThreads(threads, searchQuery),
    [threads, searchQuery]
  );

  const categorizedThreads = React.useMemo(
    () => categorizeThreads(filteredThreads),
    [filteredThreads]
  );

  const categoriesWithThreads = getCategoriesWithThreads(categorizedThreads);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  const handleThreadSelect = (threadId: string) => {
    onThreadSelect(threadId);
    onClose();
  };

  const handleNewThread = () => {
    onNewThread();
    onClose();
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

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 lg:hidden
                   flex flex-col shadow-xl animate-slideInLeft"
        role="dialog"
        aria-modal="true"
        aria-label="Thread navigation"
      >
        {/* Header */}
        <div className="flex-none p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New Thread Button */}
          <Button
            onClick={handleNewThread}
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
        <div className="flex-1 overflow-y-auto overscroll-contain">
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
                    onSelect={handleThreadSelect}
                    onDelete={handleDeleteClick}
                    onArchive={onArchiveThread}
                  />
                ))}
              </ThreadCategorySection>
            ))
          )}
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      {deletingThreadId && (
        <DeleteConfirmModal
          title="Delete Conversation?"
          message="This conversation will be permanently deleted. This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </>
  );
}
