/**
 * BudgetManager Component
 *
 * Complete budget management with API integration, loading states, and error handling.
 * This component demonstrates full integration with the backend.
 */

import React, { useState, useEffect } from 'react';
import { BudgetDashboard } from './BudgetDashboard';
import { ExpenseTracker } from './ExpenseTracker';
import { IncomeTracker } from './IncomeTracker';
import { BudgetForm } from './BudgetForm';
import { ImportExportPanel } from '../portfolio/ImportExportPanel';
import type { BudgetEntry } from './BudgetForm';
import * as budgetApi from '@/services/budgetApi';
import type { BudgetEntryResponse, BudgetSuggestions } from '@/services/budgetApi';

export interface BudgetManagerProps {
  userId?: string;
}

type View = 'dashboard' | 'expenses' | 'income' | 'import-export';

export const BudgetManager: React.FC<BudgetManagerProps> = ({ userId }) => {
  // State
  const [entries, setEntries] = useState<BudgetEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [suggestions, setSuggestions] = useState<BudgetSuggestions | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, []);

  // Load budget entries from API
  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await budgetApi.listBudgetEntries();
      setEntries(response.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget entries');
      console.error('Error loading budget entries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new entry
  const handleAddEntry = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  // Edit existing entry
  const handleEditEntry = (entry: BudgetEntry | BudgetEntryResponse) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await budgetApi.deleteBudgetEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      console.error('Error deleting entry:', err);
    }
  };

  // Save entry (create or update)
  const handleSaveEntry = async (entry: BudgetEntry) => {
    try {
      if (entry.id) {
        // Update existing
        const updated = await budgetApi.updateBudgetEntry(entry.id, entry);
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
      } else {
        // Create new
        const created = await budgetApi.createBudgetEntry(entry);
        setEntries(prev => [...prev, created]);
      }

      setShowForm(false);
      setEditingEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
      console.error('Error saving entry:', err);
    }
  };

  // Load AI suggestions
  const handleLoadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const result = await budgetApi.getBudgetSuggestions();
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      console.error('Error loading suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Extract budget from conversation
  const handleExtractFromConversation = async (conversationText: string) => {
    try {
      setLoading(true);
      const extracted = await budgetApi.extractBudgetFromConversation(conversationText, true);
      setEntries(prev => [...prev, ...extracted]);
      alert(`Successfully extracted ${extracted.length} budget entries!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract budget entries');
      console.error('Error extracting budget:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading budget data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && entries.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-red-600 text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Budget
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadEntries}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner (if error but entries exist) */}
      {error && entries.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 flex gap-2">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'dashboard'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setCurrentView('expenses')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'expenses'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💳 Expenses
        </button>
        <button
          onClick={() => setCurrentView('income')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'income'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💰 Income
        </button>
        <button
          onClick={() => setCurrentView('import-export')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === 'import-export'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📥 Import/Export
        </button>
      </div>

      {/* Current View */}
      {currentView === 'dashboard' && (
        <BudgetDashboard
          entries={entries}
          onAddEntry={handleAddEntry}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      )}

      {currentView === 'expenses' && (
        <ExpenseTracker
          entries={entries}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      )}

      {currentView === 'income' && (
        <IncomeTracker
          entries={entries}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      )}

      {/* Import/Export View */}
      {currentView === 'import-export' && (
        <ImportExportPanel
          dataType="budget"
          onImport={async (data) => {
            // Import budget entries
            const imported = await Promise.all(
              data.map(item => budgetApi.createBudgetEntry(item as BudgetEntry))
            );
            setEntries(prev => [...prev, ...imported]);
          }}
          onExport={async () => entries}
          existingData={entries}
        />
      )}

      {/* AI Suggestions Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            💡 AI Budget Suggestions
          </h3>
          <button
            onClick={handleLoadSuggestions}
            disabled={loadingSuggestions || entries.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loadingSuggestions ? 'Analyzing...' : 'Get Suggestions'}
          </button>
        </div>

        {loadingSuggestions && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {suggestions && !loadingSuggestions && (
          <div className="space-y-4">
            {/* Health Score */}
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-gray-900">
                {suggestions.health_score.toFixed(0)}
              </div>
              <div>
                <div className="text-sm text-gray-600">Budget Health Score</div>
                <div className={`text-sm font-medium ${
                  suggestions.health_category === 'excellent' ? 'text-green-600' :
                  suggestions.health_category === 'good' ? 'text-blue-600' :
                  'text-orange-600'
                }`}>
                  {suggestions.health_category.toUpperCase()}
                </div>
              </div>
              <div className="ml-auto">
                <div className="text-sm text-gray-600">Savings Rate</div>
                <div className="text-lg font-semibold text-gray-900">
                  {suggestions.savings_rate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Concerns */}
            {suggestions.concerns.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">⚠️ Concerns</h4>
                <ul className="space-y-1">
                  {suggestions.concerns.map((concern, idx) => (
                    <li key={idx} className="text-sm text-gray-700 pl-4">
                      • {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Opportunities */}
            {suggestions.opportunities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">💰 Savings Opportunities</h4>
                <div className="space-y-2">
                  {suggestions.opportunities.slice(0, 3).map((opp, idx) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-medium text-green-900 capitalize">
                          {opp.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-bold text-green-700">
                          Save ${opp.savings}/mo
                        </span>
                      </div>
                      <p className="text-sm text-green-800">{opp.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {suggestions.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">🎯 Top Recommendations</h4>
                <div className="space-y-2">
                  {suggestions.recommendations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-600">{rec.difficulty} • {rec.timeline}</span>
                      </div>
                      <p className="text-sm font-medium text-blue-900 mb-1">{rec.action}</p>
                      <p className="text-sm text-blue-700">{rec.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!suggestions && !loadingSuggestions && entries.length > 0 && (
          <p className="text-gray-600 text-center py-4">
            Click "Get Suggestions" to receive AI-powered budget recommendations
          </p>
        )}

        {entries.length === 0 && (
          <p className="text-gray-600 text-center py-4">
            Add some budget entries to get personalized suggestions
          </p>
        )}
      </div>

      {/* Budget Entry Form Modal */}
      {showForm && (
        <BudgetForm
          entry={editingEntry}
          onSave={handleSaveEntry}
          onCancel={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
};
