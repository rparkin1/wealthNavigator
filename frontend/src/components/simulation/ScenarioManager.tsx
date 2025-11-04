/**
 * Scenario Manager Component
 *
 * Save, load, organize, and manage goal scenarios with filtering and favorites.
 * Implements REQ-GOAL-010: Scenario persistence and organization.
 */

import React, { useState, useEffect } from 'react';
import { getScenarios, deleteScenario } from '../../services/goalScenariosApi';
import type { GoalScenario } from '../../types/goalScenarios';

interface ScenarioManagerProps {
  goalId: string;
  onSelectScenario: (scenario: GoalScenario) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  goalId,
  onSelectScenario,
  onCreateNew,
  onClose,
}) => {
  const [scenarios, setScenarios] = useState<GoalScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | 'conservative' | 'moderate' | 'aggressive'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'success' | 'contribution'>('created');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadScenarios();
  }, [goalId]);

  const loadScenarios = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getScenarios(goalId);
      setScenarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) {
      return;
    }

    try {
      await deleteScenario(goalId, scenarioId);
      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      setSelectedScenarios(prev => {
        const newSet = new Set(prev);
        newSet.delete(scenarioId);
        return newSet;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete scenario');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedScenarios.size === 0) return;

    if (!confirm(`Delete ${selectedScenarios.size} selected scenario(s)?`)) {
      return;
    }

    const deletePromises = Array.from(selectedScenarios).map(id => deleteScenario(goalId, id));

    try {
      await Promise.all(deletePromises);
      setScenarios(prev => prev.filter(s => !selectedScenarios.has(s.id)));
      setSelectedScenarios(new Set());
    } catch (err) {
      alert('Failed to delete some scenarios');
    }
  };

  const toggleScenarioSelection = (scenarioId: string) => {
    setSelectedScenarios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scenarioId)) {
        newSet.delete(scenarioId);
      } else {
        newSet.add(scenarioId);
      }
      return newSet;
    });
  };

  const filteredAndSortedScenarios = scenarios
    .filter(s => {
      if (filterRisk !== 'all' && s.risk_level !== filterRisk) return false;
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'success') {
        return b.success_probability - a.success_probability;
      } else if (sortBy === 'contribution') {
        return a.monthly_contribution - b.monthly_contribution;
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'conservative':
        return 'bg-blue-100 text-blue-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'aggressive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Scenario Manager</h2>
              <p className="text-sm text-blue-100 mt-1">{scenarios.length} saved scenarios</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search scenarios..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Risk */}
            <select
              value={filterRisk}
              onChange={e => setFilterRisk(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Risk Levels</option>
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created">Date Created</option>
              <option value="success">Success Probability</option>
              <option value="contribution">Monthly Cost</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              {selectedScenarios.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete ({selectedScenarios.size})
                </button>
              )}
              <button
                onClick={onCreateNew}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + New Scenario
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Loading scenarios...</span>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && filteredAndSortedScenarios.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📊</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scenarios Found</h3>
              <p className="text-gray-600 mb-6">
                {scenarios.length === 0
                  ? 'Create your first scenario to get started'
                  : 'No scenarios match your filters'}
              </p>
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Scenario
              </button>
            </div>
          )}

          {!loading && !error && filteredAndSortedScenarios.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedScenarios.map(scenario => (
                <div
                  key={scenario.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedScenarios.has(scenario.id)}
                        onChange={() => toggleScenarioSelection(scenario.id)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{scenario.name}</h3>
                        {scenario.description && (
                          <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getRiskBadgeColor(scenario.risk_level)}`}>
                      {scenario.risk_level}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="font-semibold text-green-600">
                        {formatPercentage(scenario.success_probability)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(scenario.monthly_contribution)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Projected Value</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(scenario.projected_value)}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">Created {formatDate(scenario.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelectScenario(scenario)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(scenario.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioManager;
