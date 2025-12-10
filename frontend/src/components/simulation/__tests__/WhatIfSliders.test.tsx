import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatIfSliders, WhatIfSlidersProps } from '../WhatIfSliders';

// Mock debounce to execute immediately
vi.mock('../../../utils/debounce', () => ({
  debounce: (fn: Function) => {
    const callable = () => fn();
    callable.cancel = vi.fn();
    return callable;
  },
}));

describe('WhatIfSliders', () => {
  const baseValues = {
    monthlyContribution: 2000,
    expectedReturnStocks: 0.08,
    expectedReturnBonds: 0.04,
    inflationRate: 0.03,
    retirementAge: 65,
    lifeExpectancy: 90,
  };

  const defaultProps: WhatIfSlidersProps = {
    goalId: 'goal-123',
    baseValues,
    onAdjustmentsChange: vi.fn(),
  };

  const renderComponent = (props: Partial<WhatIfSlidersProps> = {}) =>
    render(<WhatIfSliders {...defaultProps} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary sliders and reveals advanced controls on toggle', () => {
    renderComponent();

    expect(screen.getByRole('slider', { name: /monthly contribution/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /retirement age/i })).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: /expected stock returns/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /advanced options/i }));
    expect(screen.getByRole('slider', { name: /expected stock returns/i })).toBeInTheDocument();
  });

  it('displays baseline values and updates delta when slider changes', async () => {
    const onAdjustmentsChange = vi.fn();
    renderComponent({ onAdjustmentsChange });

    // Initial values formatted
    expect(screen.getByText('$2,000')).toBeInTheDocument();
    expect(screen.queryByText(/\(\+\$500\)/)).not.toBeInTheDocument();

    const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
    fireEvent.change(contributionSlider, { target: { value: '2500' } });

    expect(screen.getByText(/\(\+\$500\)/)).toHaveClass('text-green-600');

    await waitFor(() =>
      expect(onAdjustmentsChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ monthlyContribution: 2500 })
      )
    );
  });

  it('shows negative delta styling when value drops below baseline', () => {
    renderComponent();

    const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
    fireEvent.change(contributionSlider, { target: { value: '1500' } });

    const delta = screen.getByText(/\(-\$500\)/);
    expect(delta).toHaveClass('text-red-600');
  });

  it('resets adjustments to baseline when reset is clicked', async () => {
    const onAdjustmentsChange = vi.fn();
    renderComponent({ onAdjustmentsChange });

    const contributionSlider = screen.getByRole('slider', { name: /monthly contribution/i });
    fireEvent.change(contributionSlider, { target: { value: '2500' } });

    fireEvent.click(screen.getByRole('button', { name: /reset to baseline/i }));

    await waitFor(() => expect(onAdjustmentsChange).toHaveBeenLastCalledWith({}));
    expect(contributionSlider).toHaveValue('2000');
  });

  it('disables sliders and shows overlay when loading', () => {
    renderComponent({ loading: true });

    expect(screen.getByText(/recalculating/i)).toBeInTheDocument();
    screen.getAllByRole('slider').forEach(slider => {
      expect(slider).toBeDisabled();
    });
  });

  it('provides accessible labels and status updates', () => {
    renderComponent();

    const slider = screen.getByRole('slider', { name: /monthly contribution/i });
    expect(slider).toHaveAttribute('aria-label', 'Monthly Contribution');

    const valueDisplays = screen.getAllByRole('status');
    expect(valueDisplays.length).toBeGreaterThan(0);
    expect(valueDisplays[0]).toHaveTextContent('$2,000');
  });
});
