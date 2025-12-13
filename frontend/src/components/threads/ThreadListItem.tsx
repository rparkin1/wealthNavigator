/**
 * ThreadListItem Component
 *
 * Individual thread list item with hover actions and goal type indicators
 * Following WealthNavigator UI redesign design system
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  goalTypes: string[];
  messageCount?: number;
  preview?: string;
}

interface ThreadListItemProps {
  thread: Thread;
  isActive: boolean;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
  onArchive?: (threadId: string) => void;
}

const goalTypeIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  retirement: {
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    label: 'Retirement'
  },
  education: {
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    label: 'Education'
  },
  home: {
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    label: 'Home'
  },
  major_expense: {
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    label: 'Major Expense'
  },
  emergency: {
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Emergency Fund'
  },
  legacy: {
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    label: 'Legacy'
  }
};

export function ThreadListItem({
  thread,
  isActive,
  onSelect,
  onDelete,
  onArchive,
}: ThreadListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(thread.id);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(thread.id);
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
    >
      <button
        onClick={() => onSelect(thread.id)}
        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150
                   ${isActive
                     ? 'bg-blue-50 text-blue-900 shadow-sm'
                     : 'hover:bg-gray-100 text-gray-700'
                   }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Thread Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-medium truncate ${
                isActive ? 'text-blue-900' : 'text-gray-900'
              }`}
            >
              {thread.title}
            </h3>

            {thread.preview && (
              <p className="text-xs text-gray-500 truncate mt-1 line-clamp-2">
                {thread.preview}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
              <time dateTime={new Date(thread.updatedAt).toISOString()}>
                {formatDistanceToNow(thread.updatedAt, { addSuffix: true })}
              </time>

              {thread.messageCount && thread.messageCount > 0 && (
                <>
                  <span>•</span>
                  <span>{thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}</span>
                </>
              )}
            </div>
          </div>

          {/* Goal Type Indicators */}
          {thread.goalTypes && thread.goalTypes.length > 0 && (
            <div className="flex-none flex gap-1">
              {thread.goalTypes.slice(0, 2).map((type) => {
                const goalType = goalTypeIcons[type];
                if (!goalType) return null;

                return (
                  <span
                    key={type}
                    className={`inline-flex items-center justify-center w-6 h-6 rounded
                               ${isActive
                                 ? 'bg-blue-100 text-blue-700'
                                 : 'bg-gray-100 text-gray-600'
                               }`}
                    title={goalType.label}
                    aria-label={goalType.label}
                  >
                    {goalType.icon}
                  </span>
                );
              })}
              {thread.goalTypes.length > 2 && (
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium
                             ${isActive
                               ? 'bg-blue-100 text-blue-700'
                               : 'bg-gray-100 text-gray-600'
                             }`}
                  title={`+${thread.goalTypes.length - 2} more`}
                >
                  +{thread.goalTypes.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Action Buttons (show on hover, hide when active) */}
      {isHovered && !isActive && (
        <div className="absolute right-2 top-2 flex gap-1">
          {onArchive && (
            <button
              onClick={handleArchive}
              className="p-1.5 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600
                       rounded-md shadow-sm border border-gray-200 transition-colors"
              title="Archive conversation"
              aria-label="Archive conversation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600
                     rounded-md shadow-sm border border-gray-200 hover:border-red-200
                     transition-colors"
            title="Delete conversation"
            aria-label="Delete conversation"
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
        </div>
      )}
    </div>
  );
}
