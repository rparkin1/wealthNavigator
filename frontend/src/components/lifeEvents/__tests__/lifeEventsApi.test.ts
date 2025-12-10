/**
 * Life Events API Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as lifeEventsApi from '../../../services/lifeEventsApi';

// Mock fetch
global.fetch = vi.fn();

describe('Life Events API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user_id', 'test-user-123');
  });

  describe('getAllLifeEvents', () => {
    it('fetches all life events', async () => {
      const mockEvents = [{ id: '1', name: 'Test Event' }];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      } as Response);

      const result = await lifeEventsApi.getAllLifeEvents();

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/events',
        expect.objectContaining({
          headers: { 'X-User-Id': 'test-user-123' },
        })
      );
      expect(result).toEqual(mockEvents);
    });

    it('includes query parameters', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await lifeEventsApi.getAllLifeEvents({
        goalId: 'goal-123',
        eventType: 'job_loss',
        enabledOnly: true,
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/events?goal_id=goal-123&event_type=job_loss&enabled_only=true',
        expect.any(Object)
      );
    });

    it('throws error on failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
      } as Response);

      await expect(lifeEventsApi.getAllLifeEvents()).rejects.toThrow('API error: 500');
    });
  });

  describe('createLifeEvent', () => {
    it('creates a new life event', async () => {
      const mockEvent = { id: '1', name: 'Test Event' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response);

      const data = {
        event_type: 'job_loss' as const,
        name: 'Test Event',
        start_year: 2026,
        financial_impact: {},
      };

      const result = await lifeEventsApi.createLifeEvent(data);

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-User-Id': 'test-user-123',
          }),
          body: JSON.stringify(data),
        })
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('updateLifeEvent', () => {
    it('updates an existing life event', async () => {
      const mockEvent = { id: '1', name: 'Updated Event' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response);

      const result = await lifeEventsApi.updateLifeEvent('1', { name: 'Updated Event' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/events/1',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('deleteLifeEvent', () => {
    it('deletes a life event', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await lifeEventsApi.deleteLifeEvent('1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/events/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('toggleLifeEvent', () => {
    it('toggles event enabled status', async () => {
      const mockEvent = { id: '1', enabled: false };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response);

      const result = await lifeEventsApi.toggleLifeEvent('1');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/events/1/toggle',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('simulateLifeEvent', () => {
    it('simulates event impact', async () => {
      const mockResult = {
        event_id: '1',
        event_type: 'job_loss',
        baseline: { success_probability: 0.85, median_portfolio_value: 1500000 },
        with_event: { success_probability: 0.72, median_portfolio_value: 1200000 },
        impact: {
          success_probability_delta: -0.13,
          success_probability_delta_percentage: -15.3,
          portfolio_value_delta: -300000,
          portfolio_value_delta_percentage: -20.0,
          severity: 'significant' as const,
          recommended_actions: [],
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const result = await lifeEventsApi.simulateLifeEvent('1', {
        goal_id: 'goal-123',
        iterations: 5000,
      });

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/events/1/simulate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ goal_id: 'goal-123', iterations: 5000 }),
        })
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getEventTemplates', () => {
    it('fetches all templates', async () => {
      const mockTemplates = [{ id: '1', name: 'Template 1' }];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTemplates,
      } as Response);

      const result = await lifeEventsApi.getEventTemplates();

      expect(fetch).toHaveBeenCalledWith('/api/v1/life-events/templates', expect.any(Object));
      expect(result).toEqual(mockTemplates);
    });

    it('filters templates by event type', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await lifeEventsApi.getEventTemplates('job_loss');

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/templates?event_type=job_loss',
        expect.any(Object)
      );
    });
  });

  describe('createFromTemplate', () => {
    it('creates event from template', async () => {
      const mockEvent = { id: '1', name: 'Event from Template' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response);

      const result = await lifeEventsApi.createFromTemplate('template-1', 'goal-123', 2026);

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/templates/template-1/use?goal_id=goal-123&start_year=2026',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockEvent);
    });

    it('creates event without goal_id', async () => {
      const mockEvent = { id: '1', name: 'Event from Template' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response);

      await lifeEventsApi.createFromTemplate('template-1', undefined, 2026);

      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/life-events/templates/template-1/use?start_year=2026',
        expect.any(Object)
      );
    });
  });

  describe('Utility Functions', () => {
    it('returns correct event type icon', () => {
      expect(lifeEventsApi.getEventTypeIcon('job_loss')).toBe('💼');
      expect(lifeEventsApi.getEventTypeIcon('inheritance')).toBe('💰');
      expect(lifeEventsApi.getEventTypeIcon('unknown')).toBe('📅');
    });

    it('returns correct event type label', () => {
      expect(lifeEventsApi.getEventTypeLabel('job_loss')).toBe('Job Loss');
      expect(lifeEventsApi.getEventTypeLabel('inheritance')).toBe('Inheritance');
      expect(lifeEventsApi.getEventTypeLabel('unknown')).toBe('unknown');
    });

    it('returns correct severity color classes', () => {
      const colors = lifeEventsApi.getSeverityColorClasses('significant');
      expect(colors.bg).toBe('bg-orange-50');
      expect(colors.text).toBe('text-orange-700');
      expect(colors.border).toBe('border-orange-200');
    });
  });
});
