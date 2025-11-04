/**
 * EventTemplateSelector Component
 *
 * Modal for selecting from pre-built life event templates.
 * Templates provide typical scenarios with pre-filled parameters.
 */

import { useState, useEffect } from 'react';
import type { EventTemplate, LifeEventType } from '../../types/lifeEvents';
import { getEventTemplates } from '../../services/lifeEventsApi';

export interface EventTemplateSelectorProps {
  eventType?: LifeEventType;
  onSelect: (template: EventTemplate) => void;
  onClose: () => void;
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  job_loss: '💼',
  disability: '🏥',
  divorce: '💔',
  inheritance: '💰',
  major_medical: '🏥',
  home_purchase: '🏡',
  business_start: '🚀',
  career_change: '📊',
  marriage: '💍',
  child_birth: '👶',
  relocation: '📦',
  windfall: '🎰',
};

export function EventTemplateSelector({
  eventType,
  onSelect,
  onClose,
}: EventTemplateSelectorProps) {
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | undefined>(eventType);

  useEffect(() => {
    loadTemplates();
  }, [selectedType]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getEventTemplates(selectedType);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (template: EventTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select Event Template</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose from common scenarios with pre-filled parameters
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Event Type Filter */}
          <div className="mt-4">
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || undefined)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Event Types</option>
              <option value="job_loss">💼 Job Loss</option>
              <option value="disability">🏥 Disability</option>
              <option value="divorce">💔 Divorce</option>
              <option value="inheritance">💰 Inheritance</option>
              <option value="major_medical">🏥 Major Medical</option>
              <option value="home_purchase">🏡 Home Purchase</option>
              <option value="business_start">🚀 Business Start</option>
              <option value="career_change">📊 Career Change</option>
              <option value="marriage">💍 Marriage</option>
              <option value="child_birth">👶 Child Birth</option>
              <option value="relocation">📦 Relocation</option>
              <option value="windfall">🎰 Windfall</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Loading templates...</div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">{error}</div>
              <button
                onClick={loadTemplates}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && templates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Available</h3>
              <p className="text-gray-600">
                No templates found for the selected event type.
              </p>
            </div>
          )}

          {!loading && !error && templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className="text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-4xl flex-shrink-0">
                      {EVENT_TYPE_ICONS[template.event_type]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>

                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {template.description}
                        </p>
                      )}

                      {/* Parameters Preview */}
                      <div className="space-y-1">
                        {Object.entries(template.default_parameters)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key} className="text-xs text-gray-500">
                              <span className="font-medium capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>{' '}
                              {typeof value === 'number'
                                ? value.toLocaleString()
                                : String(value)}
                            </div>
                          ))}
                        {Object.keys(template.default_parameters).length > 3 && (
                          <div className="text-xs text-gray-400">
                            +{Object.keys(template.default_parameters).length - 3} more parameters
                          </div>
                        )}
                      </div>

                      {/* Usage Stats */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          Used {template.usage_count} times
                        </div>
                        {template.average_rating && (
                          <div className="text-xs text-gray-500">
                            ⭐ {template.average_rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Templates can be customized after selection
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
