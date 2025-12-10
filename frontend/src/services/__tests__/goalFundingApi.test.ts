/**
 * Goal Funding API Service Tests
 *
 * REQ-GOAL-007: Goal funding API integration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as goalFundingApi from '../goalFundingApi';
import type {
  FundingRequirementsRequest,
  SuccessProbabilityRequest,
  RequiredSavingsForProbabilityRequest,
  ContributionOptimizationRequest,
  CatchUpStrategyRequest,
} from '../../types/goalFunding';

// Mock fetch globally
global.fetch = vi.fn();

describe('goalFundingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateFundingRequirements', () => {
    it('should successfully calculate funding requirements', async () => {
      const mockResponse = {
        required_monthly_savings: 1500,
        required_annual_savings: 18000,
        lump_sum_needed_today: 250000,
        inflation_adjusted_target: 600000,
        present_value_contributions: 350000,
        funding_progress_percent: 10,
        total_contributions_needed: 360000,
        investment_growth_needed: 240000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: FundingRequirementsRequest = {
        target_amount: 500000,
        current_amount: 50000,
        years_to_goal: 20,
        expected_return: 0.07,
        inflation_rate: 0.03,
      };

      const result = await goalFundingApi.calculateFundingRequirements(request);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/goal-funding/calculate-funding-requirements'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
      );
    });

    it('should throw GoalFundingApiError on failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid input' }),
      });

      const request: FundingRequirementsRequest = {
        target_amount: 500000,
        current_amount: 50000,
        years_to_goal: 20,
      };

      await expect(goalFundingApi.calculateFundingRequirements(request)).rejects.toThrow(
        goalFundingApi.GoalFundingApiError
      );
    });
  });

  describe('calculateSuccessProbability', () => {
    it('should successfully calculate success probability', async () => {
      const mockResponse = {
        success_probability: 0.85,
        expected_final_amount: 525000,
        median_outcome: 520000,
        percentile_10th: 400000,
        percentile_25th: 460000,
        percentile_75th: 580000,
        percentile_90th: 650000,
        shortfall_risk: 0.15,
        average_shortfall_amount: 25000,
        iterations_run: 5000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: SuccessProbabilityRequest = {
        target_amount: 500000,
        current_amount: 50000,
        monthly_contribution: 1500,
        years_to_goal: 20,
        expected_return: 0.07,
        return_volatility: 0.15,
        iterations: 5000,
      };

      const result = await goalFundingApi.calculateSuccessProbability(request);

      expect(result).toEqual(mockResponse);
      expect(result.success_probability).toBeGreaterThan(0);
      expect(result.success_probability).toBeLessThanOrEqual(1);
      expect(result.iterations_run).toBe(5000);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const request: SuccessProbabilityRequest = {
        target_amount: 500000,
        current_amount: 50000,
        monthly_contribution: 1500,
        years_to_goal: 20,
      };

      await expect(goalFundingApi.calculateSuccessProbability(request)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('calculateRequiredSavingsForProbability', () => {
    it('should calculate required savings for target probability', async () => {
      const mockResponse = {
        required_monthly_savings: 1800,
        required_annual_savings: 21600,
        target_probability: 0.90,
        total_contributions: 432000,
        total_investment_growth: 68000,
        increase_from_current: 300,
        percent_increase_from_current: 20,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: RequiredSavingsForProbabilityRequest = {
        target_amount: 500000,
        current_amount: 50000,
        years_to_goal: 20,
        target_probability: 0.90,
        expected_return: 0.07,
        return_volatility: 0.15,
      };

      const result = await goalFundingApi.calculateRequiredSavingsForProbability(request);

      expect(result).toEqual(mockResponse);
      expect(result.target_probability).toBe(0.90);
      expect(result.required_monthly_savings).toBeGreaterThan(0);
    });
  });

  describe('optimizeContributionTimeline', () => {
    it('should optimize timeline when goal is achievable', async () => {
      const mockResponse = {
        is_achievable: true,
        optimal_monthly_contribution: 1400,
        projected_surplus: 50000,
        recommendations: ['Goal is achievable with current budget'],
        alternative_strategies: [
          {
            strategy: 'Reduce monthly contribution',
            monthly_contribution: 1400,
            timeline_years: 20,
            success_probability: 0.90,
            description: 'Reduce contribution by $100/month',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: ContributionOptimizationRequest = {
        target_amount: 500000,
        current_amount: 50000,
        years_to_goal: 20,
        max_monthly_contribution: 1500,
        expected_return: 0.07,
      };

      const result = await goalFundingApi.optimizeContributionTimeline(request);

      expect(result).toEqual(mockResponse);
      expect(result.is_achievable).toBe(true);
      expect(result.optimal_monthly_contribution).toBeDefined();
    });

    it('should suggest timeline extension when not achievable', async () => {
      const mockResponse = {
        is_achievable: false,
        years_extension_needed: 5,
        shortfall_with_original_timeline: 100000,
        recommendations: ['Consider extending timeline by 5 years'],
        alternative_strategies: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: ContributionOptimizationRequest = {
        target_amount: 500000,
        current_amount: 10000,
        years_to_goal: 10,
        max_monthly_contribution: 500,
        expected_return: 0.07,
      };

      const result = await goalFundingApi.optimizeContributionTimeline(request);

      expect(result.is_achievable).toBe(false);
      expect(result.years_extension_needed).toBeDefined();
    });
  });

  describe('calculateCatchUpStrategy', () => {
    it('should calculate catch-up strategy when behind schedule', async () => {
      const mockResponse = {
        is_behind_schedule: true,
        months_behind: 60,
        expected_amount_at_this_point: 150000,
        actual_amount: 100000,
        shortfall: 50000,
        required_monthly_to_catch_up: 2000,
        additional_monthly_needed: 500,
        is_feasible: true,
        recommendations: ['Increase monthly contribution by $500'],
        alternative_timeline: 18,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: CatchUpStrategyRequest = {
        target_amount: 500000,
        current_amount: 100000,
        years_remaining: 15,
        years_behind_schedule: 5,
        expected_return: 0.07,
      };

      const result = await goalFundingApi.calculateCatchUpStrategy(request);

      expect(result).toEqual(mockResponse);
      expect(result.is_behind_schedule).toBe(true);
      expect(result.shortfall).toBeGreaterThan(0);
    });
  });

  describe('comprehensiveFundingAnalysis', () => {
    it('should return comprehensive analysis with all metrics', async () => {
      const mockResponse = {
        status: 'fair' as const,
        message: 'Goal has fair probability - consider increasing contributions',
        funding_requirements: {
          required_monthly_savings: 1500,
          required_annual_savings: 18000,
          lump_sum_needed_today: 250000,
          inflation_adjusted_target: 600000,
          present_value_contributions: 350000,
          funding_progress_percent: 10,
          total_contributions_needed: 360000,
          investment_growth_needed: 240000,
        },
        current_success_probability: {
          success_probability: 0.75,
          expected_final_amount: 490000,
          median_outcome: 485000,
          percentile_10th: 380000,
          percentile_25th: 430000,
          percentile_75th: 550000,
          percentile_90th: 620000,
          shortfall_risk: 0.25,
          average_shortfall_amount: 15000,
          iterations_run: 5000,
        },
        required_for_90_percent: {
          required_monthly_savings: 1800,
          required_annual_savings: 21600,
          target_probability: 0.90,
          total_contributions: 432000,
          total_investment_growth: 68000,
        },
        monthly_contribution_gap: 300,
        recommendations: {
          current_trajectory: '75.0% success probability with current contributions',
          to_achieve_90_percent: 'Increase monthly contributions by $300.00',
          alternative_strategies: [
            'Extend timeline to reduce required monthly savings',
            'Make lump sum contribution to close funding gap',
            'Adjust target amount to match available resources',
          ],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await goalFundingApi.comprehensiveFundingAnalysis(
        500000,
        50000,
        1500,
        20,
        0.07,
        0.15
      );

      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('fair');
      expect(result.funding_requirements).toBeDefined();
      expect(result.current_success_probability).toBeDefined();
      expect(result.required_for_90_percent).toBeDefined();
      expect(result.monthly_contribution_gap).toBeDefined();
    });
  });

  describe('getCalculatorInfo', () => {
    it('should return calculator information and methodologies', async () => {
      const mockResponse = {
        methodologies: {
          funding_requirements: 'Time value of money calculations',
          success_probability: 'Monte Carlo simulation',
          optimization: 'Binary search algorithms',
        },
        formulas: {
          future_value: 'FV = PV * (1 + r)^n',
          pmt_annuity: 'PMT = FV * r / [(1 + r)^n - 1]',
          present_value_annuity: 'PV = PMT * [1 - (1 + r)^-n] / r',
        },
        assumptions: {
          return_distribution: 'Normal distribution of returns',
          contribution_timing: 'End of month contributions',
          inflation: 'Constant inflation rate',
          taxes: 'Not included in basic calculations',
          fees: 'Not included',
        },
        monte_carlo_details: {
          default_iterations: 5000,
          min_iterations: 1000,
          max_iterations: 10000,
          confidence_interval: 'Based on percentile distribution',
          random_seed: 'Not fixed',
        },
        limitations: [],
        recommendations: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await goalFundingApi.getCalculatorInfo();

      expect(result).toEqual(mockResponse);
      expect(result.methodologies).toBeDefined();
      expect(result.formulas).toBeDefined();
    });
  });

  describe('Helper Functions', () => {
    describe('formatCurrency', () => {
      it('should format currency correctly', () => {
        expect(goalFundingApi.formatCurrency(1500)).toBe('$1,500');
        expect(goalFundingApi.formatCurrency(1500000)).toBe('$1,500,000');
        expect(goalFundingApi.formatCurrency(0)).toBe('$0');
      });
    });

    describe('formatPercentage', () => {
      it('should format percentage correctly', () => {
        expect(goalFundingApi.formatPercentage(0.75)).toBe('75.0%');
        expect(goalFundingApi.formatPercentage(0.756, 2)).toBe('75.60%');
        expect(goalFundingApi.formatPercentage(1)).toBe('100.0%');
      });
    });

    describe('getStatusColor', () => {
      it('should return correct colors for probability ranges', () => {
        expect(goalFundingApi.getStatusColor(0.95)).toBe('#10b981'); // green
        expect(goalFundingApi.getStatusColor(0.80)).toBe('#3b82f6'); // blue
        expect(goalFundingApi.getStatusColor(0.65)).toBe('#f59e0b'); // amber
        expect(goalFundingApi.getStatusColor(0.45)).toBe('#f97316'); // orange
        expect(goalFundingApi.getStatusColor(0.30)).toBe('#ef4444'); // red
      });
    });

    describe('getStatusLabel', () => {
      it('should return correct labels for probability ranges', () => {
        expect(goalFundingApi.getStatusLabel(0.95)).toBe('Excellent');
        expect(goalFundingApi.getStatusLabel(0.80)).toBe('Good');
        expect(goalFundingApi.getStatusLabel(0.65)).toBe('Fair');
        expect(goalFundingApi.getStatusLabel(0.45)).toBe('At Risk');
        expect(goalFundingApi.getStatusLabel(0.30)).toBe('Critical');
      });
    });
  });
});
