/**
 * ThreadSearchInput Component
 *
 * Search input for filtering conversation threads with clear functionality
 * Following WealthNavigator UI redesign design system
 */

import React from 'react';

interface ThreadSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ThreadSearchInput({
  value,
  onChange,
  placeholder = 'Search conversations...',
  className = '',
}: ThreadSearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <svg
        className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   text-sm text-gray-900 placeholder-gray-400
                   transition-colors duration-150"
        aria-label="Search conversations"
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600
                     transition-colors duration-150"
          aria-label="Clear search"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
