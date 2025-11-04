/**
 * Goal Template Selector Component
 *
 * Displays pre-configured goal templates for quick setup.
 */

import { useState } from 'react';
import type { GoalTemplate } from '../../types/aiGoalAssistance';

export interface GoalTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  isProcessing: boolean;
}

export function GoalTemplateSelector({
  onSelectTemplate,
  isProcessing,
}: GoalTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const templates: GoalTemplate[] = [
    {
      id: 'retirement-early',
      category: 'retirement',
      title: 'Early Retirement',
      description: 'Retire before traditional retirement age with financial independence',
      typical_amount_range: { min: 1000000, max: 3000000 },
      typical_timeframe_years: 20,
      icon: '🏖️',
      priority_suggestion: 'essential',
      quick_setup_available: true,
    },
    {
      id: 'retirement-traditional',
      category: 'retirement',
      title: 'Traditional Retirement',
      description: 'Retire at age 65-67 with comfortable lifestyle',
      typical_amount_range: { min: 500000, max: 2000000 },
      typical_timeframe_years: 30,
      icon: '🏖️',
      priority_suggestion: 'essential',
      quick_setup_available: true,
    },
    {
      id: 'education-college',
      category: 'education',
      title: 'College Education',
      description: '4-year college education for one child',
      typical_amount_range: { min: 100000, max: 300000 },
      typical_timeframe_years: 15,
      icon: '🎓',
      priority_suggestion: 'important',
      quick_setup_available: true,
    },
    {
      id: 'education-private',
      category: 'education',
      title: 'Private School',
      description: 'K-12 private school education',
      typical_amount_range: { min: 150000, max: 400000 },
      typical_timeframe_years: 12,
      icon: '🎓',
      priority_suggestion: 'important',
      quick_setup_available: true,
    },
    {
      id: 'home-first',
      category: 'home',
      title: 'First Home Purchase',
      description: 'Down payment for first home (20%)',
      typical_amount_range: { min: 60000, max: 200000 },
      typical_timeframe_years: 5,
      icon: '🏠',
      priority_suggestion: 'important',
      quick_setup_available: true,
    },
    {
      id: 'home-upgrade',
      category: 'home',
      title: 'Home Upgrade',
      description: 'Move to a larger or better home',
      typical_amount_range: { min: 100000, max: 400000 },
      typical_timeframe_years: 7,
      icon: '🏠',
      priority_suggestion: 'aspirational',
      quick_setup_available: true,
    },
    {
      id: 'emergency-fund',
      category: 'emergency',
      title: 'Emergency Fund',
      description: '6 months of living expenses',
      typical_amount_range: { min: 10000, max: 50000 },
      typical_timeframe_years: 1,
      icon: '💰',
      priority_suggestion: 'essential',
      quick_setup_available: true,
    },
    {
      id: 'wedding',
      category: 'major_expense',
      title: 'Wedding',
      description: 'Save for wedding expenses',
      typical_amount_range: { min: 20000, max: 100000 },
      typical_timeframe_years: 2,
      icon: '💒',
      priority_suggestion: 'important',
      quick_setup_available: true,
    },
    {
      id: 'travel',
      category: 'major_expense',
      title: 'Dream Vacation',
      description: 'Save for a major travel experience',
      typical_amount_range: { min: 10000, max: 50000 },
      typical_timeframe_years: 2,
      icon: '✈️',
      priority_suggestion: 'aspirational',
      quick_setup_available: true,
    },
    {
      id: 'legacy',
      category: 'legacy',
      title: 'Legacy Planning',
      description: 'Estate planning and legacy for heirs',
      typical_amount_range: { min: 100000, max: 1000000 },
      typical_timeframe_years: 20,
      icon: '🌳',
      priority_suggestion: 'important',
      quick_setup_available: true,
    },
  ];

  const categories = [
    { id: 'retirement', name: 'Retirement', icon: '🏖️' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'home', name: 'Home', icon: '🏠' },
    { id: 'major_expense', name: 'Major Expense', icon: '💎' },
    { id: 'emergency', name: 'Emergency', icon: '💰' },
    { id: 'legacy', name: 'Legacy', icon: '🌳' },
  ];

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const formatAmount = (range: { min: number; max: number }) => {
    const format = (num: number) => {
      if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
      return `$${num.toLocaleString()}`;
    };
    return `${format(range.min)} - ${format(range.max)}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential':
        return 'bg-red-100 text-red-700';
      case 'important':
        return 'bg-blue-100 text-blue-700';
      case 'aspirational':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">📋</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Choose a Goal Template
            </h3>
            <p className="text-gray-700 mb-2">
              Select a pre-configured template to get started quickly. AI will customize it for your situation.
            </p>
            <p className="text-sm text-gray-600">
              ⚡ Templates include typical costs, timelines, and best practices
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Templates
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            disabled={isProcessing}
            className="text-left bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-400 hover:shadow-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {template.title}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded capitalize ${getPriorityColor(template.priority_suggestion)}`}>
                    {template.priority_suggestion}
                  </span>
                </div>
              </div>
              {template.quick_setup_available && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  ⚡ Quick
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">
              {template.description}
            </p>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-gray-500">Typical Amount</label>
                <p className="font-medium text-gray-900">
                  {formatAmount(template.typical_amount_range)}
                </p>
              </div>
              <div>
                <label className="text-gray-500">Timeframe</label>
                <p className="font-medium text-gray-900">
                  {template.typical_timeframe_years} years
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Click to customize
              </span>
              <span className="text-indigo-600 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No templates found in this category
        </div>
      )}
    </div>
  );
}
