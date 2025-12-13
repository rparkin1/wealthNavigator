/**
 * TabNavigation Component
 *
 * Horizontal tab navigation for goal detail views.
 * Responsive: horizontal tabs on desktop, vertical accordion on mobile.
 *
 * Following UI Redesign specifications - Week 8
 */

import React from 'react';
import type { GoalDetailTab } from './GoalDetailView';

export interface Tab {
  id: GoalDetailTab;
  label: string;
  enabled: boolean;
  count?: number;
}

export interface TabNavigationProps {
  tabs: Tab[];
  activeTab: GoalDetailTab;
  onChange: (tab: GoalDetailTab) => void;
}

export function TabNavigation({ tabs, activeTab, onChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      {/* Desktop: Horizontal tabs */}
      <div className="hidden md:flex">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.enabled && onChange(tab.id)}
              disabled={!tab.enabled}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : tab.enabled
                    ? 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    : 'border-transparent text-gray-400 cursor-not-allowed'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              aria-disabled={!tab.enabled}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`
                      inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile: Dropdown selector */}
      <div className="md:hidden px-4 py-3">
        <label htmlFor="tab-select" className="sr-only">
          Select a tab
        </label>
        <select
          id="tab-select"
          className="block w-full rounded-lg border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          value={activeTab}
          onChange={(e) => onChange(e.target.value as GoalDetailTab)}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id} disabled={!tab.enabled}>
              {tab.label}
              {tab.count !== undefined ? ` (${tab.count})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
