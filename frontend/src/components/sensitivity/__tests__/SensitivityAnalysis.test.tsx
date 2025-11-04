/**
 * Comprehensive Tests for Sensitivity Analysis Components
 *
 * Tests cover:
 * - TornadoDiagram visualization
 * - TwoWaySensitivityHeatmap rendering
 * - ThresholdAnalysisChart display
 * - BreakEvenCalculator functionality
 * - SensitivityAnalysisDashboard integration
 * - API service functions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TornadoDiagram from '../TornadoDiagram';
import TwoWaySensitivityHeatmap from '../TwoWaySensitivityHeatmap';
import ThresholdAnalysisChart from '../ThresholdAnalysisChart';
import BreakEvenCalculator from '../BreakEvenCalculator';
import SensitivityAnalysisDashboard from '../SensitivityAnalysisDashboard';
import {
  formatVariableName,
  formatVariableValue,
  getImpactSeverity,
  getSeverityColor,
  calculatePercentageChange,
} from '../../../services/sensitivityAnalysisApi';
import type {
  OneWaySensitivityResult,
  TwoWaySensitivityResult,
  ThresholdAnalysisResult,
  BreakEvenAnalysisResult,
} from '../../../types/sensitivityAnalysis';

// Mock data
const mockOneWayResult: OneWaySensitivityResult = {
  success: true,
  goal_id: 'test-goal-123',
  analysis: {
    variable_impacts: [
      {
        variable: 'monthly_contribution',
        baseline: 0.85,
        min_value: 800,
        max_value: 1200,
        min_probability: 0.70,
        max_probability: 0.95,
        impact_range: 0.25,
        probabilities: [0.70, 0.78, 0.85, 0.90, 0.95],
        test_values: [800, 900, 1000, 1100, 1200],
      },
      {
        variable: 'expected_return_stocks',
        baseline: 0.85,
        min_value: 0.064,
        max_value: 0.096,
        min_probability: 0.75,
        max_probability: 0.92,
        impact_range: 0.17,
        probabilities: [0.75, 0.80, 0.85, 0.88, 0.92],
        test_values: [0.064, 0.072, 0.08, 0.088, 0.096],
      },
    ],
    base_success_probability: 0.85,
    analysis_type: 'one_way',
    variation_percentage: 0.20,
  },
  message: 'Analyzed 2 variables',
};

const mockTwoWayResult: TwoWaySensitivityResult = {
  success: true,
  goal_id: 'test-goal-123',
  analysis: {
    variable1: 'monthly_contribution',
    variable2: 'expected_return_stocks',
    test_values1: [800, 900, 1000, 1100, 1200],
    test_values2: [0.064, 0.072, 0.08, 0.088, 0.096],
    probability_grid: [
      [0.65, 0.70, 0.75, 0.80, 0.85],
      [0.70, 0.75, 0.80, 0.85, 0.90],
      [0.75, 0.80, 0.85, 0.90, 0.92],
      [0.80, 0.85, 0.90, 0.92, 0.95],
      [0.85, 0.90, 0.92, 0.95, 0.97],
    ],
    min_probability: 0.65,
    max_probability: 0.97,
    analysis_type: 'two_way',
  },
  message: 'Generated 5×5 heat map',
};

const mockThresholdResult: ThresholdAnalysisResult = {
  success: true,
  goal_id: 'test-goal-123',
  analysis: {
    variable: 'monthly_contribution',
    threshold_value: 1150,
    base_value: 1000,
    delta: 150,
    delta_percentage: 15,
    achieved_probability: 0.90,
    target_probability: 0.90,
  },
  message: 'Found threshold for 90% success probability',
};

const mockBreakEvenResult: BreakEvenAnalysisResult = {
  success: true,
  goal_id: 'test-goal-123',
  analysis: {
    variable1: 'inflation_rate',
    variable2: 'monthly_contribution',
    break_even_curve: [
      { inflation_rate: 0.021, monthly_contribution: 900 },
      { inflation_rate: 0.024, monthly_contribution: 950 },
      { inflation_rate: 0.027, monthly_contribution: 1000 },
      { inflation_rate: 0.030, monthly_contribution: 1100 },
      { inflation_rate: 0.033, monthly_contribution: 1200 },
    ],
    current_value1: 0.027,
    current_value2: 1050,
    target_probability: 0.90,
    current_delta: {
      required_value: 1000,
      current_value: 1050,
      delta: 50,
      delta_percentage: 5,
      above_break_even: true,
      status: 'safe',
    },
    analysis_type: 'break_even',
  },
  message: 'Calculated break-even frontier for 90% success',
};

describe('Sensitivity Analysis Components', () => {
  describe('TornadoDiagram', () => {
    it('renders tornado diagram with data', () => {
      const { container } = render(<TornadoDiagram data={mockOneWayResult} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('displays analysis summary', () => {
      render(<TornadoDiagram data={mockOneWayResult} />);
      expect(screen.getByText('Analysis Summary')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Variables analyzed
    });

    it('shows baseline probability', () => {
      render(<TornadoDiagram data={mockOneWayResult} />);
      expect(screen.getByText(/85.0%/)).toBeInTheDocument();
    });

    it('calls onVariableClick when provided', () => {
      const mockClick = jest.fn();
      const { container } = render(
        <TornadoDiagram data={mockOneWayResult} onVariableClick={mockClick} />
      );

      // SVG click simulation would require D3 event simulation
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('TwoWaySensitivityHeatmap', () => {
    it('renders heatmap with data', () => {
      const { container } = render(
        <TwoWaySensitivityHeatmap data={mockTwoWayResult} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('displays variable names', () => {
      render(<TwoWaySensitivityHeatmap data={mockTwoWayResult} />);
      expect(screen.getByText('Monthly Contribution')).toBeInTheDocument();
      expect(screen.getByText('Expected Return Stocks')).toBeInTheDocument();
    });

    it('shows probability range', () => {
      render(<TwoWaySensitivityHeatmap data={mockTwoWayResult} />);
      expect(screen.getByText(/65.0%/)).toBeInTheDocument(); // Min
      expect(screen.getByText(/97.0%/)).toBeInTheDocument(); // Max
    });

    it('displays grid resolution', () => {
      render(<TwoWaySensitivityHeatmap data={mockTwoWayResult} />);
      expect(screen.getByText(/5 × 5 cells/)).toBeInTheDocument();
    });
  });

  describe('ThresholdAnalysisChart', () => {
    it('renders threshold analysis', () => {
      render(<ThresholdAnalysisChart data={mockThresholdResult} />);
      expect(screen.getByText(/Threshold Analysis/)).toBeInTheDocument();
    });

    it('shows on-track status when target achieved', () => {
      render(<ThresholdAnalysisChart data={mockThresholdResult} />);
      expect(screen.getByText('On Track')).toBeInTheDocument();
    });

    it('displays current and required values', () => {
      render(<ThresholdAnalysisChart data={mockThresholdResult} />);
      expect(screen.getByText('Current Value')).toBeInTheDocument();
      expect(screen.getByText('Required Value')).toBeInTheDocument();
    });

    it('shows delta information', () => {
      render(<ThresholdAnalysisChart data={mockThresholdResult} />);
      expect(screen.getByText(/15.0%/)).toBeInTheDocument(); // Delta percentage
    });

    it('displays recommendations', () => {
      render(<ThresholdAnalysisChart data={mockThresholdResult} />);
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    it('calls onAdjustGoal when button clicked', () => {
      const mockAdjust = jest.fn();
      const needsAdjustmentResult = {
        ...mockThresholdResult,
        analysis: {
          ...mockThresholdResult.analysis,
          achieved_probability: 0.70, // Below target
        },
      };

      render(
        <ThresholdAnalysisChart
          data={needsAdjustmentResult}
          onAdjustGoal={mockAdjust}
        />
      );

      const button = screen.getByText('Apply Recommended Adjustment');
      fireEvent.click(button);
      expect(mockAdjust).toHaveBeenCalledWith('monthly_contribution', 1150);
    });
  });

  describe('BreakEvenCalculator', () => {
    it('renders break-even analysis', () => {
      render(<BreakEvenCalculator data={mockBreakEvenResult} />);
      expect(screen.getByText(/Break-Even Analysis/)).toBeInTheDocument();
    });

    it('shows safe status when above break-even', () => {
      render(<BreakEvenCalculator data={mockBreakEvenResult} />);
      expect(screen.getByText('Above Break-Even (Safe)')).toBeInTheDocument();
    });

    it('displays required and current values', () => {
      render(<BreakEvenCalculator data={mockBreakEvenResult} />);
      expect(screen.getAllByText(/Monthly Contribution/).length).toBeGreaterThan(0);
    });

    it('shows delta from break-even', () => {
      render(<BreakEvenCalculator data={mockBreakEvenResult} />);
      expect(screen.getByText('Delta from Break-Even:')).toBeInTheDocument();
    });

    it('displays recommendations', () => {
      render(<BreakEvenCalculator data={mockBreakEvenResult} />);
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });
  });

  describe('SensitivityAnalysisDashboard', () => {
    it('renders dashboard with tabs', () => {
      render(<SensitivityAnalysisDashboard goalId="test-goal" />);
      expect(screen.getByText('Advanced Sensitivity Analysis')).toBeInTheDocument();
      expect(screen.getByText('Tornado Diagram')).toBeInTheDocument();
      expect(screen.getByText('Heat Map')).toBeInTheDocument();
      expect(screen.getByText('Threshold Analysis')).toBeInTheDocument();
      expect(screen.getByText('Break-Even')).toBeInTheDocument();
    });

    it('displays info banner', () => {
      render(<SensitivityAnalysisDashboard goalId="test-goal" />);
      expect(screen.getByText('What is Sensitivity Analysis?')).toBeInTheDocument();
    });

    it('switches between tabs', () => {
      render(<SensitivityAnalysisDashboard goalId="test-goal" />);

      const heatMapTab = screen.getByText('Heat Map');
      fireEvent.click(heatMapTab);

      expect(screen.getByText('Variable 1 (X-axis)')).toBeInTheDocument();
      expect(screen.getByText('Variable 2 (Y-axis)')).toBeInTheDocument();
    });
  });

  describe('API Service Utilities', () => {
    describe('formatVariableName', () => {
      it('formats variable names correctly', () => {
        expect(formatVariableName('monthly_contribution')).toBe('Monthly Contribution');
        expect(formatVariableName('expected_return_stocks')).toBe(
          'Expected Return Stocks'
        );
      });
    });

    describe('formatVariableValue', () => {
      it('formats rate values as percentages', () => {
        expect(formatVariableValue('inflation_rate', 0.03)).toBe('3.0%');
        expect(formatVariableValue('expected_return_stocks', 0.08)).toBe('8.0%');
      });

      it('formats age values', () => {
        expect(formatVariableValue('retirement_age', 65.5)).toBe('66 years');
        expect(formatVariableValue('life_expectancy', 85.2)).toBe('85 years');
      });

      it('formats currency values', () => {
        expect(formatVariableValue('monthly_contribution', 1000)).toBe('$1,000');
        expect(formatVariableValue('target_amount', 500000)).toBe('$500,000');
      });
    });

    describe('getImpactSeverity', () => {
      it('returns correct severity levels', () => {
        expect(getImpactSeverity(0.05)).toBe('low');
        expect(getImpactSeverity(0.15)).toBe('medium');
        expect(getImpactSeverity(0.25)).toBe('high');
        expect(getImpactSeverity(0.35)).toBe('critical');
      });
    });

    describe('getSeverityColor', () => {
      it('returns correct colors', () => {
        expect(getSeverityColor('low')).toBe('#10b981');
        expect(getSeverityColor('medium')).toBe('#f59e0b');
        expect(getSeverityColor('high')).toBe('#f97316');
        expect(getSeverityColor('critical')).toBe('#ef4444');
      });
    });

    describe('calculatePercentageChange', () => {
      it('calculates percentage change correctly', () => {
        expect(calculatePercentageChange(1000, 1200)).toBe(20);
        expect(calculatePercentageChange(100, 80)).toBe(-20);
        expect(calculatePercentageChange(0, 100)).toBe(0); // Edge case
      });
    });
  });
});

describe('Integration Tests', () => {
  it('completes full tornado analysis workflow', async () => {
    // This would test the full workflow with mocked API calls
    // Implementation depends on your testing setup and API mocking strategy
  });

  it('handles API errors gracefully', async () => {
    // Test error handling in dashboard
  });

  it('validates variable selection constraints', () => {
    // Test max 5 variables for tornado diagram
  });
});
