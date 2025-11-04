/**
 * Comprehensive Tests for Insurance Optimization Components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InsuranceOptimizationDashboard from '../InsuranceOptimizationDashboard';
import LifeInsuranceCalculator from '../LifeInsuranceCalculator';
import DisabilityCoverageAnalyzer from '../DisabilityCoverageAnalyzer';
import LongTermCarePlanner from '../LongTermCarePlanner';
import InsuranceGapAnalysis from '../InsuranceGapAnalysis';
import { insuranceOptimizationApi } from '../../../services/insuranceOptimizationApi';

// Mock the API
jest.mock('../../../services/insuranceOptimizationApi');

describe('Insurance Optimization Dashboard', () => {
  test('renders dashboard with all tabs', () => {
    render(<InsuranceOptimizationDashboard />);

    expect(screen.getByText(/Insurance Optimization/i)).toBeInTheDocument();
    expect(screen.getByText(/Life Insurance/i)).toBeInTheDocument();
    expect(screen.getByText(/Disability Coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/Long-Term Care/i)).toBeInTheDocument();
    expect(screen.getByText(/Gap Analysis/i)).toBeInTheDocument();
  });

  test('switches between tabs', () => {
    render(<InsuranceOptimizationDashboard />);

    const disabilityTab = screen.getByRole('button', { name: /Disability Coverage/i });
    fireEvent.click(disabilityTab);

    expect(screen.getByText(/Disability Coverage Analyzer/i)).toBeInTheDocument();
  });

  test('displays completion status', () => {
    render(<InsuranceOptimizationDashboard />);

    expect(screen.getByText(/Completion Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyses Complete/i)).toBeInTheDocument();
  });
});

describe('Life Insurance Calculator', () => {
  const mockLifeAnalysis = {
    total_needs: 1000000,
    income_replacement_need: 750000,
    debt_coverage_need: 200000,
    education_funding_need: 100000,
    final_expenses_need: 15000,
    existing_coverage: 100000,
    current_savings: 50000,
    net_insurance_need: 850000,
    income_multiplier_used: 10,
    years_of_support: 20,
    has_adequate_coverage: false,
    coverage_gap: 850000,
    estimated_term_premium_monthly: 85,
    estimated_whole_premium_monthly: 680,
    recommendation: {
      primary: 'term_life',
      recommended_coverage: 850000,
      reason: 'Most cost-effective for income replacement',
      alternatives: [],
    },
  };

  beforeEach(() => {
    (insuranceOptimizationApi.calculateLifeInsuranceNeeds as jest.Mock).mockResolvedValue(mockLifeAnalysis);
  });

  test('renders calculator form', () => {
    render(<LifeInsuranceCalculator />);

    expect(screen.getByText(/Life Insurance Needs Calculator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Annual Income/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Dependents/i)).toBeInTheDocument();
  });

  test('calculates life insurance needs', async () => {
    render(<LifeInsuranceCalculator />);

    const calculateButton = screen.getByRole('button', { name: /Calculate Life Insurance Needs/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(insuranceOptimizationApi.calculateLifeInsuranceNeeds).toHaveBeenCalled();
    });

    expect(await screen.findByText(/Analysis Results/i)).toBeInTheDocument();
    expect(screen.getByText(/Coverage gap/i)).toBeInTheDocument();
  });

  test('updates form inputs', () => {
    render(<LifeInsuranceCalculator />);

    const incomeInput = screen.getByLabelText(/Annual Income/i) as HTMLInputElement;
    fireEvent.change(incomeInput, { target: { value: '100000' } });

    expect(incomeInput.value).toBe('100000');
  });

  test('displays premium estimates', async () => {
    render(<LifeInsuranceCalculator />);

    const calculateButton = screen.getByRole('button', { name: /Calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText(/Term Life Insurance/i)).toBeInTheDocument();
      expect(screen.getByText(/Whole Life Insurance/i)).toBeInTheDocument();
    });
  });

  test('displays recommendation', async () => {
    render(<LifeInsuranceCalculator />);

    const calculateButton = screen.getByRole('button', { name: /Calculate/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText(/Recommended Policy Type/i)).toBeInTheDocument();
    });
  });
});

describe('Disability Coverage Analyzer', () => {
  const mockDisabilityAnalysis = {
    annual_income: 75000,
    recommended_monthly_benefit: 3750,
    replacement_ratio: 0.6,
    short_term_disability: {
      existing_coverage: 0,
      recommended_coverage: 22500,
      gap: 22500,
      has_adequate_coverage: false,
    },
    long_term_disability: {
      existing_monthly_coverage: 0,
      recommended_monthly_benefit: 3750,
      monthly_gap: 3750,
      has_adequate_coverage: false,
    },
    occupation_risk: 'medium',
    has_employer_coverage: false,
    recommendations: [
      {
        coverage_type: 'long_term_disability',
        recommended_monthly_benefit: 3750,
        benefit_period: 'Until age 65',
        elimination_period: '90-180 days',
        estimated_annual_cost: 1500,
        priority: 'high',
        reason: 'Protect against career-ending disability',
        features: ['Own occupation definition', 'COLA'],
      },
    ],
    key_features_to_consider: ['Definition of disability', 'Benefit period'],
  };

  beforeEach(() => {
    (insuranceOptimizationApi.analyzeDisabilityCoverage as jest.Mock).mockResolvedValue(mockDisabilityAnalysis);
  });

  test('renders analyzer form', () => {
    render(<DisabilityCoverageAnalyzer />);

    expect(screen.getByText(/Disability Coverage Analyzer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Occupation/i)).toBeInTheDocument();
  });

  test('analyzes disability coverage', async () => {
    render(<DisabilityCoverageAnalyzer />);

    const analyzeButton = screen.getByRole('button', { name: /Analyze Disability Coverage/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(insuranceOptimizationApi.analyzeDisabilityCoverage).toHaveBeenCalled();
    });
  });

  test('displays occupation risk', async () => {
    render(<DisabilityCoverageAnalyzer />);

    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));

    await waitFor(() => {
      expect(screen.getByText(/Occupation Risk Level/i)).toBeInTheDocument();
    });
  });

  test('shows coverage gaps', async () => {
    render(<DisabilityCoverageAnalyzer />);

    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));

    await waitFor(() => {
      expect(screen.getByText(/Short-Term Disability/i)).toBeInTheDocument();
      expect(screen.getByText(/Long-Term Disability/i)).toBeInTheDocument();
    });
  });
});

describe('Long-Term Care Planner', () => {
  const mockLTCAnalysis = {
    age: 55,
    preferred_care_level: 'assisted_living',
    current_daily_cost: 148,
    current_annual_cost: 54000,
    years_of_care_assumed: 3,
    years_until_likely_need: 20,
    inflated_daily_cost: 393,
    inflated_annual_cost: 143000,
    total_inflated_cost: 429000,
    current_assets: 500000,
    can_self_insure: true,
    has_existing_policy: false,
    existing_daily_benefit: 0,
    existing_coverage_value: 0,
    coverage_gap: 0,
    recommended_daily_benefit: 393,
    estimated_annual_premium: 2000,
    risk_level: 'medium',
    family_history: false,
    recommendations: [
      {
        strategy: 'hybrid_life_ltc',
        description: 'Hybrid life insurance with LTC rider',
        priority: 'high',
        reason: 'Death benefit if LTC not needed',
        key_features: ['Guaranteed premiums', 'Death benefit if unused'],
      },
    ],
    care_level_costs: {
      home_health_aide: 60000,
      assisted_living: 54000,
      nursing_home_semi_private: 94000,
      nursing_home_private: 108000,
    },
  };

  beforeEach(() => {
    (insuranceOptimizationApi.calculateLTCNeeds as jest.Mock).mockResolvedValue(mockLTCAnalysis);
  });

  test('renders planner form', () => {
    render(<LongTermCarePlanner />);

    expect(screen.getByText(/Long-Term Care Planner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Assets/i)).toBeInTheDocument();
  });

  test('calculates LTC needs', async () => {
    render(<LongTermCarePlanner />);

    fireEvent.click(screen.getByRole('button', { name: /Calculate LTC Needs/i }));

    await waitFor(() => {
      expect(insuranceOptimizationApi.calculateLTCNeeds).toHaveBeenCalled();
    });
  });

  test('displays self-insurance status', async () => {
    render(<LongTermCarePlanner />);

    fireEvent.click(screen.getByRole('button', { name: /Calculate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Self-Insurance Status/i)).toBeInTheDocument();
    });
  });

  test('shows care level costs', async () => {
    render(<LongTermCarePlanner />);

    fireEvent.click(screen.getByRole('button', { name: /Calculate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Care Level Costs/i)).toBeInTheDocument();
    });
  });
});

describe('Insurance Gap Analysis', () => {
  const mockGapAnalysis = {
    total_gaps_identified: 2,
    critical_gaps: 2,
    overall_risk_level: 'high',
    total_annual_cost_to_close_gaps: 2585,
    gaps: [
      {
        category: 'life_insurance',
        description: 'Insufficient life insurance coverage',
        gap_amount: 850000,
        annual_cost: 1020,
        priority: 'high',
        recommendations: [],
      },
      {
        category: 'disability_insurance',
        description: 'Insufficient disability coverage',
        std_gap: 22500,
        ltd_monthly_gap: 3750,
        annual_cost: 1500,
        priority: 'high',
        recommendations: [],
      },
    ],
    priority_actions: [
      '🚨 URGENT: Obtain $850,000 in term life insurance',
      '🚨 URGENT: Purchase long-term disability insurance covering 60% of income',
    ],
    summary: {
      has_life_insurance_gap: true,
      has_disability_gap: true,
      has_ltc_gap: false,
    },
  };

  const mockLifeAnalysis = {
    net_insurance_need: 850000,
    coverage_gap: 850000,
    has_adequate_coverage: false,
  } as any;

  const mockDisabilityAnalysis = {
    short_term_disability: { gap: 22500 },
    long_term_disability: { monthly_gap: 3750 },
  } as any;

  const mockLtcAnalysis = {
    coverage_gap: 0,
    can_self_insure: true,
  } as any;

  beforeEach(() => {
    (insuranceOptimizationApi.analyzeInsuranceGaps as jest.Mock).mockResolvedValue(mockGapAnalysis);
  });

  test('shows message when analyses incomplete', () => {
    render(
      <InsuranceGapAnalysis
        lifeAnalysis={null}
        disabilityAnalysis={null}
        ltcAnalysis={null}
      />
    );

    expect(screen.getByText(/Complete All Analyses First/i)).toBeInTheDocument();
  });

  test('displays gap analysis results', () => {
    render(
      <InsuranceGapAnalysis
        lifeAnalysis={mockLifeAnalysis}
        disabilityAnalysis={mockDisabilityAnalysis}
        ltcAnalysis={mockLtcAnalysis}
        gapAnalysis={mockGapAnalysis}
      />
    );

    expect(screen.getByText(/Comprehensive Insurance Gap Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Overall Risk Level/i)).toBeInTheDocument();
  });

  test('shows priority actions', () => {
    render(
      <InsuranceGapAnalysis
        lifeAnalysis={mockLifeAnalysis}
        disabilityAnalysis={mockDisabilityAnalysis}
        ltcAnalysis={mockLtcAnalysis}
        gapAnalysis={mockGapAnalysis}
      />
    );

    expect(screen.getByText(/Priority Actions/i)).toBeInTheDocument();
  });

  test('displays category summary', () => {
    render(
      <InsuranceGapAnalysis
        lifeAnalysis={mockLifeAnalysis}
        disabilityAnalysis={mockDisabilityAnalysis}
        ltcAnalysis={mockLtcAnalysis}
        gapAnalysis={mockGapAnalysis}
      />
    );

    expect(screen.getByText(/Life Insurance/i)).toBeInTheDocument();
    expect(screen.getByText(/Disability Insurance/i)).toBeInTheDocument();
    expect(screen.getByText(/Long-Term Care/i)).toBeInTheDocument();
  });

  test('shows no gaps message when coverage adequate', () => {
    const noGapsAnalysis = {
      ...mockGapAnalysis,
      gaps: [],
      overall_risk_level: 'none',
    };

    render(
      <InsuranceGapAnalysis
        lifeAnalysis={mockLifeAnalysis}
        disabilityAnalysis={mockDisabilityAnalysis}
        ltcAnalysis={mockLtcAnalysis}
        gapAnalysis={noGapsAnalysis}
      />
    );

    expect(screen.getByText(/No Insurance Gaps Detected/i)).toBeInTheDocument();
  });
});
