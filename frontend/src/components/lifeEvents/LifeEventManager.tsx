/**
 * LifeEventManager Component
 *
 * Main dashboard for managing life events. Displays all user's life events,
 * allows filtering, and provides actions for create/edit/delete/simulate.
 */

import { useState, useEffect } from 'react';
import {
  BriefcaseIcon,
  HeartIcon,
  BanknotesIcon,
  HomeIcon,
  RocketLaunchIcon,
  ArrowPathIcon,
  UserPlusIcon,
  TruckIcon,
  SparklesIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { LifeEventForm } from './LifeEventForm';
import { LifeEventTimeline } from './LifeEventTimeline';
import { LifeEventImpactComparison } from './LifeEventImpactComparison';
import { EventTemplateSelector } from './EventTemplateSelector';
import type { LifeEvent, LifeEventManagerProps, EventTemplate } from '../../types/lifeEvents';
import * as lifeEventsApi from '../../services/lifeEventsApi';

// Re-export types for backward compatibility
export type { LifeEvent, LifeEventManagerProps };

const EVENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  job_loss: <BriefcaseIcon className="w-5 h-5" />,
  disability: <HeartIcon className="w-5 h-5" />,
  divorce: <HeartIcon className="w-5 h-5" />,
  inheritance: <BanknotesIcon className="w-5 h-5" />,
  major_medical: <HeartIcon className="w-5 h-5" />,
  home_purchase: <HomeIcon className="w-5 h-5" />,
  business_start: <RocketLaunchIcon className="w-5 h-5" />,
  career_change: <ArrowPathIcon className="w-5 h-5" />,
  marriage: <HeartIcon className="w-5 h-5" />,
  child_birth: <UserPlusIcon className="w-5 h-5" />,
  relocation: <TruckIcon className="w-5 h-5" />,
  windfall: <SparklesIcon className="w-5 h-5" />,
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  job_loss: 'Job Loss',
  disability: 'Disability',
  divorce: 'Divorce',
  inheritance: 'Inheritance',
  major_medical: 'Major Medical',
  home_purchase: 'Home Purchase',
  business_start: 'Business Start',
  career_change: 'Career Change',
  marriage: 'Marriage',
  child_birth: 'Child Birth',
  relocation: 'Relocation',
  windfall: 'Windfall',
};

const SEVERITY_COLORS: Record<string, string> = {
  minimal: 'text-green-600 bg-green-50',
  moderate: 'text-yellow-600 bg-yellow-50',
  significant: 'text-orange-600 bg-orange-50',
  severe: 'text-red-600 bg-red-50',
};

export function LifeEventManager({ goalId, onEventSelect }: LifeEventManagerProps) {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  useEffect(() => {
    loadEvents();
  }, [goalId, filterType, filterEnabled]);

  const loadEvents = async (): Promise<LifeEvent[]> => {
    setLoading(true);
    setError(null);

    try {
      const data = await lifeEventsApi.getAllLifeEvents({
        goalId,
        eventType: filterType || undefined,
        enabledOnly: filterEnabled !== null ? filterEnabled : undefined,
      });
      setEvents(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedEvent(null);
    setShowForm(true);
  };

  const handleCreateFromTemplate = () => {
    setShowTemplateSelector(true);
  };

  const handleTemplateSelect = async (template: EventTemplate) => {
    try {
      const currentYear = new Date().getFullYear();
      await lifeEventsApi.createFromTemplate(template.id, goalId, currentYear);
      await loadEvents();
      setShowTemplateSelector(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create event from template');
    }
  };

  const handleEdit = (event: LifeEvent) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this life event?')) return;

    try {
      await lifeEventsApi.deleteLifeEvent(eventId);
      await loadEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleToggle = async (eventId: string) => {
    try {
      await lifeEventsApi.toggleLifeEvent(eventId);
      await loadEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle event');
    }
  };

  const handleSimulate = async (event: LifeEvent) => {
    if (!event.goal_id) {
      alert('This event must be associated with a goal to simulate impact');
      return;
    }

    try {
      await lifeEventsApi.simulateLifeEvent(event.id, {
        goal_id: event.goal_id,
        iterations: 5000,
      });
      const updated = await loadEvents();
      setSelectedEvent(updated.find(e => e.id === event.id) || null);
      setShowComparison(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Simulation failed');
    }
  };

  const handleFormClose = async (saved?: boolean) => {
    setShowForm(false);
    setSelectedEvent(null);
    if (saved) await loadEvents();
  };

  const handleFormSave = async (data: any) => {
    try {
      if (selectedEvent) {
        await lifeEventsApi.updateLifeEvent(selectedEvent.id, data);
      } else {
        await lifeEventsApi.createLifeEvent({ ...data, goal_id: goalId });
      }
      await loadEvents();
      handleFormClose(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save event');
    }
  };

  const filteredEvents = events.filter(event => {
    if (filterType && event.event_type !== filterType) return false;
    if (filterEnabled !== null && event.enabled !== filterEnabled) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading life events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800">Error: {error}</div>
        <button
          onClick={loadEvents}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Life Event Planning</h2>
          <p className="text-sm text-gray-600 mt-1">
            Model major life events and understand their financial impact
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateFromTemplate}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            From Template
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Custom Event
          </button>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          {/* Event Type Filter */}
          <select
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {EVENT_TYPE_ICONS[value]} {label}
              </option>
            ))}
          </select>

          {/* Enabled Filter */}
          <select
            value={filterEnabled === null ? 'all' : String(filterEnabled)}
            onChange={(e) => setFilterEnabled(e.target.value === 'all' ? null : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Events</option>
            <option value="true">Enabled Only</option>
            <option value="false">Disabled Only</option>
          </select>

          <div className="text-sm text-gray-600">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'timeline' ? (
        <LifeEventTimeline
          events={filteredEvents.map(e => ({
            id: e.id,
            name: e.name,
            year: e.start_year,
            duration: e.duration_years,
            type: e.event_type,
            enabled: e.enabled,
          }))}
          onEventClick={(id) => {
            const ev = events.find(e => e.id === id);
            if (ev) handleEdit(ev);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <div className="flex justify-center mb-4">
                <CalendarIcon className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Life Events</h3>
              <p className="text-gray-600 mb-4">
                Add your first life event to see how it might impact your financial goals
              </p>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Life Event
              </button>
            </div>
          ) : (
            filteredEvents.map(event => (
              <div
                key={event.id}
                className={`bg-white p-6 rounded-lg border-2 transition-all ${
                  event.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{EVENT_TYPE_ICONS[event.event_type]}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Year {event.start_year}</span>
                          {event.duration_years > 1 && (
                            <>
                              <span>•</span>
                              <span>{event.duration_years} years</span>
                            </>
                          )}
                          {event.probability < 1.0 && (
                            <>
                              <span>•</span>
                              <span>{(event.probability * 100).toFixed(0)}% probability</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                    )}

                    {/* Simulation Results */}
                    {event.simulation_results && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900">Impact Analysis</h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              SEVERITY_COLORS[event.simulation_results.impact.severity]
                            }`}
                          >
                            {event.simulation_results.impact.severity.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-600">Success Probability</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {(event.simulation_results.with_event.success_probability * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-red-600">
                              {event.simulation_results.impact.success_probability_delta > 0 ? '+' : ''}
                              {(event.simulation_results.impact.success_probability_delta * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Portfolio Value</div>
                            <div className="text-lg font-semibold text-gray-900">
                              ${(event.simulation_results.with_event.median_portfolio_value / 1000).toFixed(0)}k
                            </div>
                            <div className="text-xs text-red-600">
                              {event.simulation_results.impact.portfolio_value_delta > 0 ? '+' : ''}
                              ${(event.simulation_results.impact.portfolio_value_delta / 1000).toFixed(0)}k
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Last Simulated</div>
                            <div className="text-sm text-gray-900">
                              {event.last_simulated_at
                                ? new Date(event.last_simulated_at).toLocaleDateString()
                                : 'Never'}
                            </div>
                          </div>
                        </div>

                        {event.simulation_results.impact.recommended_actions.length > 0 && (
                          <div className="pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Recommendations:</div>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {event.simulation_results.impact.recommended_actions.slice(0, 2).map((action, idx) => (
                                <li key={idx}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleToggle(event.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        event.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {event.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleSimulate(event)}
                      aria-disabled={!event.goal_id}
                      className={`px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 ${
                        !event.goal_id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Simulate
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <LifeEventForm
          onClose={() => handleFormClose(false)}
          onSave={handleFormSave}
          initialData={selectedEvent || undefined}
        />
      )}

      {showComparison && selectedEvent?.simulation_results && (
        <LifeEventImpactComparison
          event={selectedEvent}
          onClose={() => setShowComparison(false)}
        />
      )}

      {showTemplateSelector && (
        <EventTemplateSelector
          eventType={filterType as any}
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}
