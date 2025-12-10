/**
 * Estate Planning Components Tests
 *
 * Comprehensive test suite for estate planning components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import EstatePlanningDashboard from '../EstatePlanningDashboard';
import EstateTaxProjection from '../EstateTaxProjection';
import TrustStructureBuilder from '../TrustStructureBuilder';
import BeneficiaryManager from '../BeneficiaryManager';
import LegacyGoalPlanner from '../LegacyGoalPlanner';
import GiftingStrategyAnalyzer from '../GiftingStrategyAnalyzer';
import * as api from '../../../services/estatePlanningApi';

// Mock the API module
vi.mock('../../../services/estatePlanningApi');

describe('Estate Planning Dashboard', () => {
  test('renders dashboard with all tabs', () => {
    render(<EstatePlanningDashboard />);

    expect(screen.getByText('Estate Planning')).toBeInTheDocument();
    expect(screen.getByText('Estate Tax')).toBeInTheDocument();
    expect(screen.getByText('Trust Structures')).toBeInTheDocument();
    expect(screen.getByText('Beneficiaries')).toBeInTheDocument();
    expect(screen.getByText('Legacy Goals')).toBeInTheDocument();
    expect(screen.getByText('Gifting Strategy')).toBeInTheDocument();
  });

  test('switches between tabs', () => {
    render(<EstatePlanningDashboard />);

    const trustsTab = screen.getByText('Trust Structures');
    fireEvent.click(trustsTab);

    // Trust tab content should be visible
    expect(screen.getByText('Trust Structure Recommendations')).toBeInTheDocument();
  });

  test('default tab is Estate Tax', () => {
    render(<EstatePlanningDashboard />);

    expect(screen.getByText('Estate Tax Projection')).toBeInTheDocument();
  });
});

describe('Estate Tax Projection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders form with all inputs', () => {
    render(<EstateTaxProjection />);

    expect(screen.getByLabelText(/Estate Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Marital Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Life Insurance Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Charitable Donations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Outstanding Debt/i)).toBeInTheDocument();
  });

  test('calculates estate tax successfully', async () => {
    const mockCalculation = {
      gross_estate: 5000000,
      deductions: 0,
      taxable_estate: 5000000,
      federal_exemption: 13610000,
      federal_taxable_amount: 0,
      federal_tax: 0,
      state_exemption: 6940000,
      state_taxable_amount: 0,
      state_tax: 0,
      total_tax: 0,
      net_estate: 5000000,
      effective_rate: 0,
      has_federal_tax_liability: false,
      has_state_tax_liability: false,
    };

    vi.mocked(api.estatePlanningApi.calculateEstateTax).mockResolvedValue(mockCalculation);

    render(<EstateTaxProjection />);

    const calculateButton = screen.getByRole('button', { name: /Calculate Estate Tax/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Estate Tax Calculation Results')).toBeInTheDocument();
      expect(screen.getByText(/\$5,000,000/)).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    vi.mocked(api.estatePlanningApi.calculateEstateTax).mockRejectedValue(
      new Error('Failed to calculate')
    );

    render(<EstateTaxProjection />);

    const calculateButton = screen.getByRole('button', { name: /Calculate Estate Tax/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to calculate/i)).toBeInTheDocument();
    });
  });

  test('updates form values', () => {
    render(<EstateTaxProjection />);

    const estateValueInput = screen.getByLabelText(/Estate Value/i) as HTMLInputElement;
    fireEvent.change(estateValueInput, { target: { value: '10000000' } });

    expect(estateValueInput.value).toBe('10000000');
  });

  test('shows loading state during calculation', async () => {
    vi.mocked(api.estatePlanningApi.calculateEstateTax).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<EstateTaxProjection />);

    const calculateButton = screen.getByRole('button', { name: /Calculate Estate Tax/i });
    fireEvent.click(calculateButton);

    expect(screen.getByText('Calculating...')).toBeInTheDocument();
  });
});

describe('Trust Structure Builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders form with all inputs', () => {
    render(<TrustStructureBuilder />);

    expect(screen.getByLabelText(/Estate Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Marital Status/i)).toBeInTheDocument();
    expect(screen.getByText(/I have children or dependents/i)).toBeInTheDocument();
  });

  test('gets trust recommendations successfully', async () => {
    const mockRecommendations = {
      recommendations: [
        {
          name: 'Revocable Living Trust',
          estate_tax_benefit: false,
          probate_avoidance: true,
          asset_protection: false,
          complexity: 'low' as const,
          cost: 1500,
          priority: 'high' as const,
          reason: 'Avoids probate, maintains control',
          suitability_score: 90,
        },
      ],
    };

    vi.mocked(api.estatePlanningApi.recommendTrustStructures).mockResolvedValue(
      mockRecommendations
    );

    render(<TrustStructureBuilder />);

    const getRecommendationsButton = screen.getByRole('button', {
      name: /Get Trust Recommendations/i,
    });
    fireEvent.click(getRecommendationsButton);

    await waitFor(() => {
      expect(screen.getByText('Revocable Living Trust')).toBeInTheDocument();
      expect(screen.getByText(/Avoids probate/i)).toBeInTheDocument();
    });
  });

  test('expands trust details on click', async () => {
    const mockRecommendations = {
      recommendations: [
        {
          name: 'Dynasty Trust',
          estate_tax_benefit: true,
          probate_avoidance: true,
          asset_protection: true,
          complexity: 'high' as const,
          cost: 7500,
          priority: 'medium' as const,
          reason: 'Multi-generational wealth transfer',
          suitability_score: 75,
        },
      ],
    };

    vi.mocked(api.estatePlanningApi.recommendTrustStructures).mockResolvedValue(
      mockRecommendations
    );

    render(<TrustStructureBuilder />);

    const getRecommendationsButton = screen.getByRole('button', {
      name: /Get Trust Recommendations/i,
    });
    fireEvent.click(getRecommendationsButton);

    await waitFor(() => {
      const trustHeader = screen.getByText('Dynasty Trust');
      fireEvent.click(trustHeader.closest('[role="button"]')!);
    });

    // Details should be visible after clicking
    await waitFor(() => {
      expect(screen.getByText('Estate Tax Benefit')).toBeInTheDocument();
      expect(screen.getByText('Probate Avoidance')).toBeInTheDocument();
    });
  });

  test('handles checkbox interactions', () => {
    render(<TrustStructureBuilder />);

    const charitableCheckbox = screen.getByLabelText(
      /I have charitable giving goals/i
    ) as HTMLInputElement;

    expect(charitableCheckbox.checked).toBe(false);

    fireEvent.click(charitableCheckbox);

    expect(charitableCheckbox.checked).toBe(true);
  });
});

describe('Beneficiary Manager', () => {
  test('renders accounts and beneficiaries sections', () => {
    render(<BeneficiaryManager />);

    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Beneficiaries')).toBeInTheDocument();
  });

  test('adds new account', () => {
    render(<BeneficiaryManager />);

    const initialAccounts = screen.getAllByRole('combobox').length;

    const addAccountButton = screen.getByRole('button', { name: /Add Account/i });
    fireEvent.click(addAccountButton);

    const updatedAccounts = screen.getAllByRole('combobox').length;

    expect(updatedAccounts).toBeGreaterThan(initialAccounts);
  });

  test('removes account', () => {
    render(<BeneficiaryManager />);

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    const initialCount = removeButtons.length;

    fireEvent.click(removeButtons[0]);

    const updatedRemoveButtons = screen.getAllByRole('button', { name: /Remove/i });

    expect(updatedRemoveButtons.length).toBe(initialCount - 1);
  });

  test('adds new beneficiary', () => {
    render(<BeneficiaryManager />);

    const addBeneficiaryButton = screen.getByRole('button', { name: /Add Beneficiary/i });
    fireEvent.click(addBeneficiaryButton);

    const beneficiaryInputs = screen.getAllByPlaceholderText(/Name/i);

    // Should have more beneficiary inputs after adding
    expect(beneficiaryInputs.length).toBeGreaterThan(0);
  });
});

describe('Legacy Goal Planner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders form with all inputs', () => {
    render(<LegacyGoalPlanner />);

    expect(screen.getByLabelText(/Desired Legacy Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Estate Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Years to Legacy Event/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expected Annual Return/i)).toBeInTheDocument();
  });

  test('calculates legacy goal successfully - on track', async () => {
    const mockAnalysis = {
      desired_legacy: 2000000,
      estimated_estate_tax: 0,
      gross_estate_needed: 2000000,
      current_estate_value: 1500000,
      projected_estate_value: 3000000,
      is_on_track: true,
      shortfall: 0,
      surplus: 1000000,
      annual_savings_needed: 0,
      monthly_savings_needed: 0,
      life_insurance_alternative: 0,
      funding_strategies: [],
    };

    vi.mocked(api.estatePlanningApi.calculateLegacyGoal).mockResolvedValue(mockAnalysis);

    render(<LegacyGoalPlanner />);

    const calculateButton = screen.getByRole('button', { name: /Calculate Legacy Goal/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('On Track')).toBeInTheDocument();
      expect(screen.getByText(/projected to exceed/i)).toBeInTheDocument();
    });
  });

  test('calculates legacy goal successfully - shortfall', async () => {
    const mockAnalysis = {
      desired_legacy: 2000000,
      estimated_estate_tax: 100000,
      gross_estate_needed: 2100000,
      current_estate_value: 1000000,
      projected_estate_value: 1500000,
      is_on_track: false,
      shortfall: 600000,
      surplus: 0,
      annual_savings_needed: 30000,
      monthly_savings_needed: 2500,
      life_insurance_alternative: 600000,
      funding_strategies: [
        {
          strategy: 'increase_savings',
          description: 'Increase annual savings to build estate value',
          priority: 'high' as const,
        },
      ],
    };

    vi.mocked(api.estatePlanningApi.calculateLegacyGoal).mockResolvedValue(mockAnalysis);

    render(<LegacyGoalPlanner />);

    const calculateButton = screen.getByRole('button', { name: /Calculate Legacy Goal/i });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      expect(screen.getByText('Needs Attention')).toBeInTheDocument();
      expect(screen.getByText(/shortfall/i)).toBeInTheDocument();
      expect(screen.getByText('Savings Required to Close Gap')).toBeInTheDocument();
    });
  });
});

describe('Gifting Strategy Analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders form with all inputs', () => {
    render(<GiftingStrategyAnalyzer />);

    expect(screen.getByLabelText(/Current Estate Value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Annual Gift Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Years of Gifting/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expected Annual Return/i)).toBeInTheDocument();
  });

  test('analyzes gifting strategy successfully', async () => {
    const mockAnalysis = {
      annual_gift_amount: 50000,
      years_of_gifting: 15,
      total_gifts: 750000,
      estate_without_gifting: 10000000,
      estate_with_gifting: 8500000,
      gifts_future_value: 1500000,
      tax_without_gifting: 0,
      tax_with_gifting: 0,
      tax_savings: 200000,
      wealth_transferred_no_gifts: 10000000,
      wealth_transferred_with_gifts: 10200000,
      additional_wealth: 200000,
      is_within_annual_exclusion: false,
      gift_tax_applicable: true,
    };

    vi.mocked(api.estatePlanningApi.analyzeGiftingStrategy).mockResolvedValue(mockAnalysis);

    render(<GiftingStrategyAnalyzer />);

    const analyzeButton = screen.getByRole('button', { name: /Analyze Gifting Strategy/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Gifting Strategy Analysis')).toBeInTheDocument();
      expect(screen.getByText('Tax Savings')).toBeInTheDocument();
      expect(screen.getByText('With vs. Without Gifting Strategy')).toBeInTheDocument();
    });
  });

  test('shows warning for gifts exceeding annual exclusion', async () => {
    const mockAnalysis = {
      annual_gift_amount: 50000,
      years_of_gifting: 15,
      total_gifts: 750000,
      estate_without_gifting: 10000000,
      estate_with_gifting: 8500000,
      gifts_future_value: 1500000,
      tax_without_gifting: 0,
      tax_with_gifting: 0,
      tax_savings: 200000,
      wealth_transferred_no_gifts: 10000000,
      wealth_transferred_with_gifts: 10200000,
      additional_wealth: 200000,
      is_within_annual_exclusion: false,
      gift_tax_applicable: true,
    };

    vi.mocked(api.estatePlanningApi.analyzeGiftingStrategy).mockResolvedValue(mockAnalysis);

    render(<GiftingStrategyAnalyzer />);

    const analyzeButton = screen.getByRole('button', { name: /Analyze Gifting Strategy/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Gift Tax May Apply/i)).toBeInTheDocument();
    });
  });

  test('shows success for gifts within annual exclusion', async () => {
    const mockAnalysis = {
      annual_gift_amount: 18000,
      years_of_gifting: 10,
      total_gifts: 180000,
      estate_without_gifting: 5000000,
      estate_with_gifting: 4700000,
      gifts_future_value: 250000,
      tax_without_gifting: 0,
      tax_with_gifting: 0,
      tax_savings: 0,
      wealth_transferred_no_gifts: 5000000,
      wealth_transferred_with_gifts: 4950000,
      additional_wealth: 0,
      is_within_annual_exclusion: true,
      gift_tax_applicable: false,
    };

    vi.mocked(api.estatePlanningApi.analyzeGiftingStrategy).mockResolvedValue(mockAnalysis);

    render(<GiftingStrategyAnalyzer />);

    const analyzeButton = screen.getByRole('button', { name: /Analyze Gifting Strategy/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Within Annual Exclusion/i)).toBeInTheDocument();
    });
  });
});
