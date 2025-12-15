/**
 * EventTemplateSelector Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { EventTemplateSelector } from '../EventTemplateSelector';
import * as lifeEventsApi from '../../../services/lifeEventsApi';
import type { EventTemplate } from '../../../types/lifeEvents';

vi.mock('../../../services/lifeEventsApi');

const mockTemplates: EventTemplate[] = [
  {
    id: 'template-1',
    event_type: 'job_loss',
    name: 'Standard Job Loss',
    description: 'Typical layoff with 3 months severance',
    default_parameters: {
      income_loss_percentage: 1.0,
      severance_months: 3,
      job_search_months: 6,
      new_income_percentage: 0.9,
    },
    usage_count: 150,
    average_rating: 4.5,
  },
  {
    id: 'template-2',
    event_type: 'inheritance',
    name: 'Moderate Inheritance',
    description: '$250,000 inheritance from family member',
    default_parameters: {
      amount: 250000,
      tax_rate: 0.0,
      asset_type: 'cash',
    },
    usage_count: 75,
    average_rating: 4.2,
  },
];

describe('EventTemplateSelector', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(lifeEventsApi.getEventTemplates).mockResolvedValue(mockTemplates);
  });

  describe('Rendering', () => {
    it('renders loading state initially', () => {
      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);
      expect(screen.getByText(/loading templates/i)).toBeInTheDocument();
    });

    it('renders templates after loading', async () => {
      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Standard Job Loss')).toBeInTheDocument();
        expect(screen.getByText('Moderate Inheritance')).toBeInTheDocument();
      });
    });

    it('displays empty state when no templates exist', async () => {
      vi.mocked(lifeEventsApi.getEventTemplates).mockResolvedValue([]);

      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/no templates available/i)).toBeInTheDocument();
      });
    });

    it('renders error state on API failure', async () => {
      vi.mocked(lifeEventsApi.getEventTemplates).mockRejectedValue(new Error('API Error'));

      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template Selection', () => {
    it('calls onSelect and onClose when template is clicked', async () => {
      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Standard Job Loss')).toBeInTheDocument();
      });

      const template = screen.getByText('Standard Job Loss').closest('button');
      fireEvent.click(template!);

      expect(mockOnSelect).toHaveBeenCalledWith(mockTemplates[0]);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Filtering', () => {
    it('filters templates by event type', async () => {
      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Standard Job Loss')).toBeInTheDocument();
      });

      const filterSelect = screen.getByRole('combobox');
      fireEvent.change(filterSelect, { target: { value: 'job_loss' } });

      await waitFor(() => {
        expect(lifeEventsApi.getEventTemplates).toHaveBeenCalledWith('job_loss');
      });
    });

    it('pre-filters templates by eventType prop', async () => {
      render(
        <EventTemplateSelector
          eventType="inheritance"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(lifeEventsApi.getEventTemplates).toHaveBeenCalledWith('inheritance');
      });
    });
  });

  describe('Template Display', () => {
    it('displays template metadata', async () => {
      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Standard Job Loss')).toBeInTheDocument();
      });

      expect(screen.getByText(/typical layoff with 3 months severance/i)).toBeInTheDocument();
      expect(screen.getByText('Used 150 times')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.5')).toBeInTheDocument();
    });

    it('displays parameter previews', async () => {
      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Standard Job Loss')).toBeInTheDocument();
      });

      // Should show first 3 parameters
      expect(screen.getByText(/income loss percentage/i)).toBeInTheDocument();
      expect(screen.getByText(/severance months/i)).toBeInTheDocument();
      expect(screen.getByText(/job search months/i)).toBeInTheDocument();
    });
  });

  describe('Close Actions', () => {
    it('calls onClose when close button is clicked', async () => {
      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Standard Job Loss')).toBeInTheDocument();
      });

      const closeButtons = screen.getAllByRole('button', { name: '' });
      // Find the X button
      const xButton = closeButtons.find(btn => btn.querySelector('svg'));
      fireEvent.click(xButton!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when Cancel button is clicked', async () => {
      render(<EventTemplateSelector onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Standard Job Loss')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
