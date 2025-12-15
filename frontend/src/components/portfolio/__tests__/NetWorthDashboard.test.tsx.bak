/**
 * Net Worth Dashboard Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NetWorthDashboard } from '../NetWorthDashboard';
import * as useNetWorthData from '../../../hooks/useNetWorthData';

// Mock the hook
vi.mock('../../../hooks/useNetWorthData');

describe('NetWorthDashboard', () => {
  const mockData = [
    {
      date: '2024-01-01',
      totalNetWorth: 450000,
      totalAssets: 700000,
      totalLiabilities: 250000,
      liquidNetWorth: 350000,
      assetsByClass: {
        cash: 50000,
        stocks: 150000,
        bonds: 75000,
        realEstate: 300000,
        other: 125000,
      },
    },
    {
      date: '2024-06-01',
      totalNetWorth: 500000,
      totalAssets: 750000,
      totalLiabilities: 250000,
      liquidNetWorth: 400000,
      assetsByClass: {
        cash: 50000,
        stocks: 200000,
        bonds: 75000,
        realEstate: 300000,
        other: 125000,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useNetWorthData.useNetWorthData).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    render(<NetWorthDashboard userId="test-user" />);

    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders error state', () => {
    const refetch = vi.fn();
    vi.mocked(useNetWorthData.useNetWorthData).mockReturnValue({
      data: null,
      loading: false,
      error: { error: 'Network error', detail: 'Failed to fetch' },
      refetch,
      reset: vi.fn(),
    });

    render(<NetWorthDashboard userId="test-user" />);

    expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
  });

  it('renders net worth data', () => {
    vi.mocked(useNetWorthData.useNetWorthData).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    render(<NetWorthDashboard userId="test-user" />);

    expect(screen.getByText(/net worth tracking/i)).toBeInTheDocument();
  });

  it('allows changing time periods', async () => {
    const user = userEvent.setup();

    vi.mocked(useNetWorthData.useNetWorthData).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    render(<NetWorthDashboard userId="test-user" />);

    const threeMonthButton = screen.getByRole('button', { name: /3 months/i });
    await user.click(threeMonthButton);

    expect(threeMonthButton).toHaveClass('bg-white');
  });

  it('toggles view modes', async () => {
    const user = userEvent.setup();

    vi.mocked(useNetWorthData.useNetWorthData).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    render(<NetWorthDashboard userId="test-user" />);

    const areaChartButton = screen.getByRole('button', { name: /area chart/i });
    await user.click(areaChartButton);

    expect(areaChartButton).toHaveClass('bg-white');
  });

  it('toggles moving average', async () => {
    const user = userEvent.setup();

    vi.mocked(useNetWorthData.useNetWorthData).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    render(<NetWorthDashboard userId="test-user" />);

    const movingAverageButton = screen.getByRole('button', { name: /moving average/i });
    await user.click(movingAverageButton);

    expect(movingAverageButton).toHaveClass('bg-white');
  });

  it('toggles projection view', async () => {
    const user = userEvent.setup();

    vi.mocked(useNetWorthData.useNetWorthData).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    render(<NetWorthDashboard userId="test-user" />);

    const projectionButton = screen.getByRole('button', { name: /projection/i });
    await user.click(projectionButton);

    await waitFor(() => {
      expect(screen.getByText(/net worth projection/i)).toBeInTheDocument();
    });
  });

  it('handles empty data state', () => {
    vi.mocked(useNetWorthData.useNetWorthData).mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      reset: vi.fn(),
    });

    render(<NetWorthDashboard userId="test-user" />);

    expect(screen.getByText(/no net worth data available/i)).toBeInTheDocument();
  });
});
