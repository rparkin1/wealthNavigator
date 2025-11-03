/**
 * Integration Tests for DistributionHistogram Component
 *
 * Tests the D3.js-based distribution visualization for Monte Carlo results
 */

import { render, screen, waitFor } from '@testing-library/react';
import { DistributionHistogram } from '../DistributionHistogram';
import '@testing-library/jest-dom';

describe('DistributionHistogram Integration Tests', () => {
  const mockData = {
    values: Array.from({ length: 5000 }, (_, i) =>
      900000 + i * 40 + (Math.random() - 0.5) * 100000
    ),
    successThreshold: 1000000,
    percentiles: {
      p10: 850000,
      p25: 920000,
      p50: 1050000,
      p75: 1180000,
      p90: 1300000,
    },
  };

  it('renders without crashing', () => {
    render(<DistributionHistogram data={mockData} />);
    expect(screen.getByText('Distribution Analysis')).toBeInTheDocument();
  });

  it('displays all percentiles', () => {
    render(<DistributionHistogram data={mockData} />);

    expect(screen.getByText('P10')).toBeInTheDocument();
    expect(screen.getByText('P25')).toBeInTheDocument();
    expect(screen.getByText('P50')).toBeInTheDocument();
    expect(screen.getByText('P75')).toBeInTheDocument();
    expect(screen.getByText('P90')).toBeInTheDocument();
  });

  it('renders D3 SVG chart', async () => {
    const { container } = render(<DistributionHistogram data={mockData} />);

    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('width')).toBe('600');
      expect(svg?.getAttribute('height')).toBe('300');
    });
  });

  it('renders histogram bars', async () => {
    const { container } = render(<DistributionHistogram data={mockData} />);

    await waitFor(() => {
      const bars = container.querySelectorAll('rect');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  it('shows success threshold line', async () => {
    const { container } = render(<DistributionHistogram data={mockData} />);

    await waitFor(() => {
      const line = container.querySelector('line[stroke="#ef4444"]');
      expect(line).toBeInTheDocument();
    });
  });

  it('handles custom dimensions', () => {
    const { container } = render(
      <DistributionHistogram data={mockData} width={800} height={400} />
    );

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('800');
    expect(svg?.getAttribute('height')).toBe('400');
  });

  it('renders with mock data when no data provided', () => {
    render(<DistributionHistogram />);
    expect(screen.getByText('Distribution Analysis')).toBeInTheDocument();
  });

  it('colors bars correctly based on success threshold', async () => {
    const { container } = render(<DistributionHistogram data={mockData} />);

    await waitFor(() => {
      const bars = container.querySelectorAll('rect[fill="#10b981"]');
      expect(bars.length).toBeGreaterThan(0); // Green bars (above threshold)

      const blueBars = container.querySelectorAll('rect[fill="#3b82f6"]');
      expect(blueBars.length).toBeGreaterThan(0); // Blue bars (below threshold)
    });
  });

  it('formats percentile values correctly', () => {
    render(<DistributionHistogram data={mockData} />);

    // Check that values are formatted as thousands
    expect(screen.getByText(/850k/i)).toBeInTheDocument();
    expect(screen.getByText(/1050k/i)).toBeInTheDocument();
  });
});
