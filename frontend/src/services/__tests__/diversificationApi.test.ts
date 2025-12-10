/**
 * Diversification API Service Tests
 *
 * REQ-RISK-008: Diversification metrics tests
 * REQ-RISK-009: Concentration risk identification tests
 * REQ-RISK-010: Diversification recommendations tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as diversificationApi from '../diversificationApi';
import type {
  DiversificationAnalysisRequest,
  SimplifiedDiversificationRequest,
  HoldingInfo,
} from '../../types/diversification';

// Mock fetch globally
global.fetch = vi.fn();

describe('diversificationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHoldings: HoldingInfo[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      value: 50000,
      weight: 0.25,
      asset_class: 'US_LargeCap',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      geography: 'US',
      manager: 'Individual Stock',
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      value: 40000,
      weight: 0.20,
      asset_class: 'US_LargeCap',
      sector: 'Technology',
      industry: 'Software',
      geography: 'US',
      manager: 'Individual Stock',
    },
  ];

  describe('analyzeDiversification', () => {
    it('should successfully analyze diversification', async () => {
      const mockResponse = {
        metrics: {
          holdings_count: 8,
          effective_securities: 6.2,
          herfindahl_index: 0.125,
          diversification_score: 72,
          diversification_level: 'Good' as const,
          concentration_score: 28,
        },
        top_holdings: [
          { symbol: 'AAPL', name: 'Apple Inc.', weight: 0.25, value: 50000, rank: 1 },
        ],
        concentration_breakdown: {
          sector: [],
          geography: [],
          asset_class: [],
          manager: [],
        },
        concentration_risks: [],
        recommendations: [],
        summary: 'Your portfolio shows good diversification',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: DiversificationAnalysisRequest = {
        portfolio_value: 200000,
        holdings: mockHoldings,
      };

      const result = await diversificationApi.analyzeDiversification(request);

      expect(result).toEqual(mockResponse);
      expect(result.metrics.diversification_score).toBeGreaterThan(0);
      expect(result.metrics.diversification_score).toBeLessThanOrEqual(100);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/diversification/analyze'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        })
      );
    });

    it('should throw DiversificationApiError on failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      const request: DiversificationAnalysisRequest = {
        portfolio_value: 200000,
        holdings: mockHoldings,
      };

      await expect(diversificationApi.analyzeDiversification(request)).rejects.toThrow(
        diversificationApi.DiversificationApiError
      );
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

      const request: DiversificationAnalysisRequest = {
        portfolio_value: 200000,
        holdings: mockHoldings,
      };

      await expect(diversificationApi.analyzeDiversification(request)).rejects.toThrow(
        'Network failure'
      );
    });
  });

  describe('analyzeDiversificationSimple', () => {
    it('should analyze with simplified input', async () => {
      const mockResponse = {
        metrics: {
          holdings_count: 2,
          effective_securities: 1.8,
          herfindahl_index: 0.325,
          diversification_score: 45,
          diversification_level: 'Fair' as const,
          concentration_score: 55,
        },
        top_holdings: [],
        concentration_breakdown: {
          sector: [],
          geography: [],
          asset_class: [],
          manager: [],
        },
        concentration_risks: [
          {
            risk_type: 'single_holding' as const,
            severity: 'high' as const,
            description: 'Single holding concentration detected',
            affected_holdings: ['AAPL'],
            concentration_weight: 0.25,
            threshold_exceeded: 0.05,
            recommendation: 'Reduce position in AAPL',
          },
        ],
        recommendations: [],
        summary: 'Consider improving diversification',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: SimplifiedDiversificationRequest = {
        holdings: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            value: 50000,
            asset_class: 'US_LargeCap',
            sector: 'Technology',
          },
          {
            symbol: 'MSFT',
            name: 'Microsoft',
            value: 40000,
            asset_class: 'US_LargeCap',
            sector: 'Technology',
          },
        ],
      };

      const result = await diversificationApi.analyzeDiversificationSimple(request);

      expect(result).toEqual(mockResponse);
      expect(result.concentration_risks.length).toBeGreaterThan(0);
    });
  });

  describe('getExampleAnalysis', () => {
    it('should return example analysis', async () => {
      const mockResponse = {
        metrics: {
          holdings_count: 8,
          effective_securities: 5.5,
          herfindahl_index: 0.15,
          diversification_score: 68,
          diversification_level: 'Good' as const,
          concentration_score: 32,
        },
        top_holdings: [],
        concentration_breakdown: {
          sector: [],
          geography: [],
          asset_class: [],
          manager: [],
        },
        concentration_risks: [],
        recommendations: [],
        summary: 'Example portfolio analysis',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await diversificationApi.getExampleAnalysis();

      expect(result).toEqual(mockResponse);
      expect(result.metrics).toBeDefined();
    });
  });

  describe('getConcentrationThresholds', () => {
    it('should return concentration thresholds', async () => {
      const mockResponse = {
        single_holding: {
          critical: 0.40,
          high: 0.20,
          medium: 0.10,
        },
        top_5: {
          critical: 0.80,
          high: 0.60,
        },
        sector: {
          critical: 0.50,
          high: 0.35,
        },
        geography: {
          critical: 0.80,
          high: 0.70,
        },
        manager: {
          high: 0.40,
        },
        asset_class: {
          high: 0.85,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await diversificationApi.getConcentrationThresholds();

      expect(result).toEqual(mockResponse);
      expect(result.single_holding.critical).toBe(0.40);
      expect(result.top_5.high).toBe(0.60);
    });
  });

  describe('getRecommendationsOnly', () => {
    it('should return only recommendations', async () => {
      const mockResponse = {
        recommendations: [
          {
            priority: 'high' as const,
            action: 'Reduce technology sector concentration',
            rationale: 'Tech sector represents 65% of portfolio',
            target: 'Reduce to below 50%',
            impact: 'Lower sector-specific risk',
            specific_actions: ['Sell 15% of tech holdings', 'Buy diversified ETFs'],
          },
        ],
        concentration_risks: [],
        diversification_score: 65,
        diversification_level: 'Fair',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: DiversificationAnalysisRequest = {
        portfolio_value: 200000,
        holdings: mockHoldings,
      };

      const result = await diversificationApi.getRecommendationsOnly(request);

      expect(result).toEqual(mockResponse);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.diversification_score).toBeDefined();
    });
  });

  describe('Helper Functions', () => {
    describe('formatPercentage', () => {
      it('should format percentage correctly', () => {
        expect(diversificationApi.formatPercentage(0.75)).toBe('75.0%');
        expect(diversificationApi.formatPercentage(0.756, 2)).toBe('75.60%');
        expect(diversificationApi.formatPercentage(1)).toBe('100.0%');
      });
    });

    describe('getSeverityColor', () => {
      it('should return correct colors for severity levels', () => {
        expect(diversificationApi.getSeverityColor('critical')).toBe('#ef4444');
        expect(diversificationApi.getSeverityColor('high')).toBe('#f97316');
        expect(diversificationApi.getSeverityColor('medium')).toBe('#f59e0b');
        expect(diversificationApi.getSeverityColor('low')).toBe('#10b981');
      });
    });

    describe('getSeverityBgColor', () => {
      it('should return correct background colors', () => {
        expect(diversificationApi.getSeverityBgColor('critical')).toBe('#fee2e2');
        expect(diversificationApi.getSeverityBgColor('high')).toBe('#ffedd5');
        expect(diversificationApi.getSeverityBgColor('medium')).toBe('#fef3c7');
        expect(diversificationApi.getSeverityBgColor('low')).toBe('#d1fae5');
      });
    });

    describe('getDiversificationLevelColor', () => {
      it('should return correct colors for diversification levels', () => {
        expect(diversificationApi.getDiversificationLevelColor('Excellent')).toBe('#10b981');
        expect(diversificationApi.getDiversificationLevelColor('Good')).toBe('#3b82f6');
        expect(diversificationApi.getDiversificationLevelColor('Fair')).toBe('#f59e0b');
        expect(diversificationApi.getDiversificationLevelColor('Poor')).toBe('#f97316');
        expect(diversificationApi.getDiversificationLevelColor('Critical')).toBe('#ef4444');
      });
    });

    describe('getConcentrationTypeIcon', () => {
      it('should return correct icons for concentration types', () => {
        expect(diversificationApi.getConcentrationTypeIcon('single_holding')).toBe('🎯');
        expect(diversificationApi.getConcentrationTypeIcon('top_5')).toBe('📊');
        expect(diversificationApi.getConcentrationTypeIcon('sector')).toBe('🏭');
        expect(diversificationApi.getConcentrationTypeIcon('geography')).toBe('🌍');
        expect(diversificationApi.getConcentrationTypeIcon('asset_class')).toBe('💼');
        expect(diversificationApi.getConcentrationTypeIcon('manager')).toBe('👤');
      });
    });

    describe('getPriorityColor', () => {
      it('should return correct colors for priority levels', () => {
        expect(diversificationApi.getPriorityColor('high')).toBe('#ef4444');
        expect(diversificationApi.getPriorityColor('medium')).toBe('#f59e0b');
        expect(diversificationApi.getPriorityColor('low')).toBe('#3b82f6');
      });
    });

    describe('getDiversificationScoreDisplay', () => {
      it('should return correct display properties for scores', () => {
        const excellent = diversificationApi.getDiversificationScoreDisplay(85);
        expect(excellent.level).toBe('Excellent');
        expect(excellent.color).toBe('#10b981');
        expect(excellent.icon).toBe('✅');

        const good = diversificationApi.getDiversificationScoreDisplay(70);
        expect(good.level).toBe('Good');
        expect(good.color).toBe('#3b82f6');

        const fair = diversificationApi.getDiversificationScoreDisplay(50);
        expect(fair.level).toBe('Fair');
        expect(fair.color).toBe('#f59e0b');

        const poor = diversificationApi.getDiversificationScoreDisplay(30);
        expect(poor.level).toBe('Poor');
        expect(poor.color).toBe('#f97316');

        const critical = diversificationApi.getDiversificationScoreDisplay(15);
        expect(critical.level).toBe('Critical');
        expect(critical.color).toBe('#ef4444');
        expect(critical.icon).toBe('🚨');
      });
    });
  });
});
