/**
 * ThreadCategorySection Component
 *
 * Collapsible category section for grouping threads by date
 * Following WealthNavigator UI redesign design system
 */

import React from 'react';

interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  goalTypes: string[];
  messageCount?: number;
  preview?: string;
}

interface ThreadCategorySectionProps {
  category: string;
  label: string;
  threads: Thread[];
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function ThreadCategorySection({
  category,
  label,
  threads,
  isExpanded,
  onToggle,
  children,
}: ThreadCategorySectionProps) {
  if (threads.length === 0) {
    return null;
  }

  return (
    <div className="mb-2">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 flex items-center justify-between
                   hover:bg-gray-50 transition-colors duration-150
                   group"
        aria-expanded={isExpanded}
        aria-controls={`category-${category}`}
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">
            {threads.length}
          </span>

          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200
                       ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Thread Items */}
      {isExpanded && (
        <div
          id={`category-${category}`}
          className="space-y-1 px-2 pb-2 animate-fadeIn"
        >
          {children}
        </div>
      )}
    </div>
  );
}
