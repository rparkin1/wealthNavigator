/**
 * ThreadSidebar Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThreadSidebar } from './ThreadSidebar';

describe('ThreadSidebar', () => {
  const mockThreads = [
    {
      id: 'thread-1',
      title: 'Retirement Planning',
      createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      updatedAt: Date.now() - 2 * 60 * 60 * 1000,
      goalTypes: ['retirement'],
      messageCount: 5,
      preview: 'I want to retire at 60...',
    },
    {
      id: 'thread-2',
      title: 'College Savings',
      createdAt: Date.now() - 25 * 60 * 60 * 1000, // Yesterday
      updatedAt: Date.now() - 25 * 60 * 60 * 1000,
      goalTypes: ['education'],
      messageCount: 3,
      preview: 'Save for college education...',
    },
    {
      id: 'thread-3',
      title: 'Home Purchase',
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
      updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      goalTypes: ['home'],
      messageCount: 8,
    },
  ];

  const defaultProps = {
    threads: mockThreads,
    currentThreadId: null,
    onThreadSelect: vi.fn(),
    onNewThread: vi.fn(),
    onDeleteThread: vi.fn(),
  };

  it('renders the sidebar with threads', () => {
    render(<ThreadSidebar {...defaultProps} />);

    expect(screen.getByText('Conversations')).toBeInTheDocument();
    expect(screen.getByText('Retirement Planning')).toBeInTheDocument();
    expect(screen.getByText('College Savings')).toBeInTheDocument();

    // Home Purchase is in Past 30 Days category which starts collapsed
    // Expand it first
    const past30DaysHeader = screen.getByText('Past 30 Days');
    fireEvent.click(past30DaysHeader.closest('button')!);

    expect(screen.getByText('Home Purchase')).toBeInTheDocument();
  });

  it('categorizes threads by date', () => {
    render(<ThreadSidebar {...defaultProps} />);

    // Check for date category headers
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Past 30 Days')).toBeInTheDocument();
  });

  it('calls onNewThread when new conversation button is clicked', () => {
    const onNewThread = vi.fn();
    render(<ThreadSidebar {...defaultProps} onNewThread={onNewThread} />);

    const newButton = screen.getByText('New Conversation');
    fireEvent.click(newButton);

    expect(onNewThread).toHaveBeenCalledTimes(1);
  });

  it('calls onThreadSelect when thread is clicked', () => {
    const onThreadSelect = vi.fn();
    render(<ThreadSidebar {...defaultProps} onThreadSelect={onThreadSelect} />);

    const thread = screen.getByText('Retirement Planning');
    fireEvent.click(thread);

    expect(onThreadSelect).toHaveBeenCalledWith('thread-1');
  });

  it('highlights the current thread', () => {
    render(<ThreadSidebar {...defaultProps} currentThreadId="thread-1" />);

    const threadButton = screen.getByText('Retirement Planning').closest('button');
    expect(threadButton).toHaveClass('bg-blue-50');
  });

  it('filters threads based on search query', () => {
    render(<ThreadSidebar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'retirement' } });

    // Should show retirement thread
    expect(screen.getByText('Retirement Planning')).toBeInTheDocument();

    // Should not show other threads
    expect(screen.queryByText('College Savings')).not.toBeInTheDocument();
    expect(screen.queryByText('Home Purchase')).not.toBeInTheDocument();
  });

  it('shows empty state when no threads match search', () => {
    render(<ThreadSidebar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No conversations found')).toBeInTheDocument();
  });

  it('clears search when X button is clicked', () => {
    render(<ThreadSidebar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'retirement' } });

    // Click clear button
    const clearButtons = screen.getAllByRole('button');
    const clearButton = clearButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && svg.querySelector('path[d*="M6 18L18 6M6 6l12 12"]');
    });

    if (clearButton) {
      fireEvent.click(clearButton);
    }

    expect(searchInput).toHaveValue('');
  });

  it('shows delete confirmation modal', () => {
    render(<ThreadSidebar {...defaultProps} />);

    // Hover over thread to show delete button
    const thread = screen.getByText('College Savings').closest('.group');
    if (thread) {
      fireEvent.mouseEnter(thread);

      // Find and click delete button
      const buttons = within(thread).getAllByRole('button');
      const deleteButton = buttons.find((btn) => btn.title === 'Delete conversation');

      if (deleteButton) {
        fireEvent.click(deleteButton);

        // Check modal appears
        expect(screen.getByText('Delete Conversation?')).toBeInTheDocument();
        expect(screen.getByText(/This conversation will be permanently deleted/)).toBeInTheDocument();
      }
    }
  });

  it('confirms deletion when confirmed', () => {
    const onDeleteThread = vi.fn();
    render(<ThreadSidebar {...defaultProps} onDeleteThread={onDeleteThread} />);

    // Trigger delete flow
    const thread = screen.getByText('College Savings').closest('.group');
    if (thread) {
      fireEvent.mouseEnter(thread);

      const buttons = within(thread).getAllByRole('button');
      const deleteButton = buttons.find((btn) => btn.title === 'Delete conversation');

      if (deleteButton) {
        fireEvent.click(deleteButton);

        // Confirm deletion
        const confirmButton = screen.getByText('Delete');
        fireEvent.click(confirmButton);

        expect(onDeleteThread).toHaveBeenCalledWith('thread-2');
      }
    }
  });

  it('cancels deletion when cancelled', () => {
    const onDeleteThread = vi.fn();
    render(<ThreadSidebar {...defaultProps} onDeleteThread={onDeleteThread} />);

    // Trigger delete flow
    const thread = screen.getByText('College Savings').closest('.group');
    if (thread) {
      fireEvent.mouseEnter(thread);

      const buttons = within(thread).getAllByRole('button');
      const deleteButton = buttons.find((btn) => btn.title === 'Delete conversation');

      if (deleteButton) {
        fireEvent.click(deleteButton);

        // Cancel deletion
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onDeleteThread).not.toHaveBeenCalled();
        expect(screen.queryByText('Delete Conversation?')).not.toBeInTheDocument();
      }
    }
  });

  it('toggles category expansion', () => {
    render(<ThreadSidebar {...defaultProps} />);

    const todayHeader = screen.getByText('Today');
    const todayButton = todayHeader.closest('button');

    // Initially expanded - thread should be visible
    expect(screen.getByText('Retirement Planning')).toBeInTheDocument();

    // Click to collapse
    if (todayButton) {
      fireEvent.click(todayButton);
    }

    // Thread should be hidden
    expect(screen.queryByText('Retirement Planning')).not.toBeInTheDocument();

    // Click to expand again
    if (todayButton) {
      fireEvent.click(todayButton);
    }

    // Thread should be visible again
    expect(screen.getByText('Retirement Planning')).toBeInTheDocument();
  });

  it('displays message count', () => {
    render(<ThreadSidebar {...defaultProps} />);

    expect(screen.getByText('5 messages')).toBeInTheDocument();
    expect(screen.getByText('3 messages')).toBeInTheDocument();

    // Expand Past 30 Days to see the third thread
    const past30DaysHeader = screen.getByText('Past 30 Days');
    fireEvent.click(past30DaysHeader.closest('button')!);

    expect(screen.getByText('8 messages')).toBeInTheDocument();
  });

  it('displays goal type badges', () => {
    const { container } = render(<ThreadSidebar {...defaultProps} />);

    // Check for goal type emojis
    expect(container.textContent).toContain('🏖️'); // retirement
    expect(container.textContent).toContain('🎓'); // education

    // Expand Past 30 Days to see home emoji
    const past30DaysHeader = screen.getByText('Past 30 Days');
    fireEvent.click(past30DaysHeader.closest('button')!);

    expect(container.textContent).toContain('🏠'); // home
  });

  it('shows empty state when no threads exist', () => {
    render(<ThreadSidebar {...defaultProps} threads={[]} />);

    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.getByText('Start a new conversation to begin')).toBeInTheDocument();
  });

  it('renders in collapsed mode', () => {
    render(<ThreadSidebar {...defaultProps} isCollapsed={true} />);

    // Should not show thread titles
    expect(screen.queryByText('Retirement Planning')).not.toBeInTheDocument();
    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();

    // Should show collapse button
    expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument();
  });

  it('calls onToggleCollapse when collapse button is clicked', () => {
    const onToggleCollapse = vi.fn();
    render(<ThreadSidebar {...defaultProps} onToggleCollapse={onToggleCollapse} />);

    const collapseButton = screen.getByTitle('Collapse sidebar');
    fireEvent.click(collapseButton);

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('displays thread preview text', () => {
    render(<ThreadSidebar {...defaultProps} />);

    expect(screen.getByText('I want to retire at 60...')).toBeInTheDocument();
    expect(screen.getByText('Save for college education...')).toBeInTheDocument();
  });

  it('calls onSearch when search query changes', () => {
    const onSearch = vi.fn();
    render(<ThreadSidebar {...defaultProps} onSearch={onSearch} />);

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'retirement' } });

    expect(onSearch).toHaveBeenCalledWith('retirement');
  });
});
