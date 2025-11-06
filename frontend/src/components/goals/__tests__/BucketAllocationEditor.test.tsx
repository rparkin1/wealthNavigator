/**
 * Integration Tests for BucketAllocationEditor Component
 *
 * Tests the account allocation interface for mental accounting buckets
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BucketAllocationEditor } from '../BucketAllocationEditor';
import * as mentalAccountingApi from '../../../services/mentalAccountingApi';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the API module
vi.mock('../../../services/mentalAccountingApi');

describe('BucketAllocationEditor Integration Tests', () => {
  const mockGoal = {
    id: 'goal-1',
    title: 'Retirement at 65',
    category: 'retirement',
    targetAmount: 1500000,
    currentAmount: 600000,
    targetDate: '2045-01-01',
    priority: 'essential' as const,
    status: 'on_track' as const,
  };

  const mockAccounts = [
    {
      id: 'account-1',
      name: '401(k) Account',
      type: 'retirement',
      balance: 250000,
    },
    {
      id: 'account-2',
      name: 'Traditional IRA',
      type: 'retirement',
      balance: 150000,
    },
    {
      id: 'account-3',
      name: 'Brokerage Account',
      type: 'taxable',
      balance: 100000,
    },
  ];

  const mockExistingAllocations = [
    {
      account_id: 'account-1',
      account_name: '401(k) Account',
      balance: 250000,
      allocation_percentage: 50,
      contribution_rate: 1000,
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnAllocationUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editor with goal information', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Allocate Accounts to Goal')).toBeInTheDocument();
    expect(screen.getByText('Retirement at 65')).toBeInTheDocument();
    expect(screen.getByText(/Target Amount:/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,500,000/)).toBeInTheDocument();
  });

  it('displays goal summary metrics', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Current Amount:')).toBeInTheDocument();
    expect(screen.getByText(/\$600,000/)).toBeInTheDocument();
    expect(screen.getByText('Funding Gap:')).toBeInTheDocument();
    expect(screen.getByText(/\$900,000/)).toBeInTheDocument();
  });

  it('shows all available accounts', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('401(k) Account')).toBeInTheDocument();
    expect(screen.getByText('Traditional IRA')).toBeInTheDocument();
    expect(screen.getByText('Brokerage Account')).toBeInTheDocument();
  });

  it('displays account balances', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/\$250,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$150,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$100,000/)).toBeInTheDocument();
  });

  it('loads existing allocations', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        existingAllocations={mockExistingAllocations}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const account1Checkbox = checkboxes.find((cb) =>
      cb.closest('div')?.textContent?.includes('401(k) Account')
    );
    expect(account1Checkbox).toBeChecked();
  });

  it('toggles account selection', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox = checkboxes[0];

    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('shows allocation controls when account is selected', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText('Allocation Percentage')).toBeInTheDocument();
    expect(screen.getByText('Monthly Contribution')).toBeInTheDocument();
  });

  it('updates percentage allocation', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const percentageInputs = screen.getAllByRole('spinbutton');
    const percentageInput = percentageInputs.find(
      (input) => input.getAttribute('max') === '100'
    );

    if (percentageInput) {
      fireEvent.change(percentageInput, { target: { value: '75' } });
      expect(percentageInput).toHaveValue(75);
    }
  });

  it('updates monthly contribution', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const inputs = screen.getAllByRole('spinbutton');
    const contributionInput = inputs.find(
      (input) => input.getAttribute('step') === '10'
    );

    if (contributionInput) {
      fireEvent.change(contributionInput, { target: { value: '500' } });
      expect(contributionInput).toHaveValue(500);
    }
  });

  it('calculates allocated amount correctly', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const percentageInputs = screen.getAllByRole('spinbutton');
    const percentageInput = percentageInputs.find(
      (input) => input.getAttribute('max') === '100'
    );

    if (percentageInput) {
      fireEvent.change(percentageInput, { target: { value: '50' } });
      // 50% of $250,000 = $125,000
      expect(screen.getByText(/\$125,000/)).toBeInTheDocument();
    }
  });

  it('shows total allocation percentage', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Total Allocation')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('updates total allocation when percentages change', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const percentageInputs = screen.getAllByRole('spinbutton');
    const percentageInputsFiltered = percentageInputs.filter(
      (input) => input.getAttribute('max') === '100'
    );

    if (percentageInputsFiltered.length >= 2) {
      fireEvent.change(percentageInputsFiltered[0], { target: { value: '60' } });
      fireEvent.change(percentageInputsFiltered[1], { target: { value: '30' } });
      expect(screen.getByText('90.0%')).toBeInTheDocument();
    }
  });

  it('warns when total allocation exceeds 100%', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const percentageInputs = screen.getAllByRole('spinbutton');
    const percentageInput = percentageInputs.find(
      (input) => input.getAttribute('max') === '100'
    );

    if (percentageInput) {
      fireEvent.change(percentageInput, { target: { value: '120' } });
      expect(screen.getByText(/Total allocation exceeds 100%/)).toBeInTheDocument();
    }
  });

  it('calls onClose when Cancel is clicked', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables Save button when no accounts selected', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save Allocations');
    expect(saveButton).toBeDisabled();
  });

  it('enables Save button when valid allocation exists', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const saveButton = screen.getByText('Save Allocations');
    expect(saveButton).not.toBeDisabled();
  });

  it('saves allocations when Save is clicked', async () => {
    const mockAllocateAccount = vi.fn().mockResolvedValue({
      goal_id: 'goal-1',
      account_id: 'account-1',
      allocation_percentage: 50,
      monthly_contribution: 1000,
    });
    vi.mocked(mentalAccountingApi.allocateAccountToGoal).mockImplementation(mockAllocateAccount);

    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
        onAllocationUpdated={mockOnAllocationUpdated}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const percentageInputs = screen.getAllByRole('spinbutton');
    const percentageInput = percentageInputs.find(
      (input) => input.getAttribute('max') === '100'
    );
    const contributionInput = percentageInputs.find(
      (input) => input.getAttribute('step') === '10'
    );

    if (percentageInput) {
      fireEvent.change(percentageInput, { target: { value: '50' } });
    }
    if (contributionInput) {
      fireEvent.change(contributionInput, { target: { value: '1000' } });
    }

    const saveButton = screen.getByText('Save Allocations');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAllocateAccount).toHaveBeenCalled();
      expect(mockOnAllocationUpdated).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error message when save fails', async () => {
    const mockAllocateAccount = vi.fn().mockRejectedValue(new Error('API Error'));
    vi.mocked(mentalAccountingApi.allocateAccountToGoal).mockImplementation(mockAllocateAccount);

    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const saveButton = screen.getByText('Save Allocations');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
    });
  });

  it('handles empty available accounts gracefully', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={[]}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No accounts available for allocation')).toBeInTheDocument();
  });

  it('displays annual contribution amount', () => {
    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const inputs = screen.getAllByRole('spinbutton');
    const contributionInput = inputs.find(
      (input) => input.getAttribute('step') === '10'
    );

    if (contributionInput) {
      fireEvent.change(contributionInput, { target: { value: '500' } });
      // $500/month = $6,000/year
      expect(screen.getByText(/\$6,000\/year/)).toBeInTheDocument();
    }
  });

  it('shows loading state when saving', async () => {
    const mockAllocateAccount = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 1000))
    );
    vi.mocked(mentalAccountingApi.allocateAccountToGoal).mockImplementation(mockAllocateAccount);

    render(
      <BucketAllocationEditor
        goal={mockGoal}
        availableAccounts={mockAccounts}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const saveButton = screen.getByText('Save Allocations');
    fireEvent.click(saveButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});
