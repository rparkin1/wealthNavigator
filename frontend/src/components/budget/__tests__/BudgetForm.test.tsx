import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BudgetForm } from '../BudgetForm';

describe('BudgetForm', () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows switching entry type and updates category options', async () => {
    const user = userEvent.setup();
    render(<BudgetForm onSubmit={onSubmit} onCancel={onCancel} />);

    // Income is selected by default
    expect(screen.getByRole('button', { name: /💰 Income/ })).toHaveClass('border-green-600');
    expect(screen.getByRole('button', { name: /salary\/wages/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /💳 Expense/ }));

    // Expense type is highlighted and expense categories render
    expect(screen.getByRole('button', { name: /💳 Expense/ })).toHaveClass('border-red-600');
    expect(screen.getByRole('button', { name: /housing \(rent\/mortgage\)/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\., rent payment/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /🎯 Savings/ }));

    expect(screen.getByRole('button', { name: /🎯 Savings/ })).toHaveClass('border-blue-600');
    expect(screen.getByRole('button', { name: /retirement contribution/i })).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    const user = userEvent.setup();
    render(<BudgetForm onSubmit={onSubmit} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /add entry/i }));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits cleaned payload when form is valid', async () => {
    const user = userEvent.setup();
    render(<BudgetForm onSubmit={onSubmit} onCancel={onCancel} />);

    const nameInput = screen.getByPlaceholderText(/monthly salary/i);
    await user.clear(nameInput);
    await user.type(nameInput, '  Salary Income  ');

    const amountInput = screen.getByPlaceholderText('0.00');
    await user.clear(amountInput);
    await user.type(amountInput, '5000');

    const notesInput = screen.getByPlaceholderText(/additional notes/i);
    await user.type(notesInput, '  important note  ');

    await user.click(screen.getByRole('button', { name: /add entry/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      category: 'salary',
      name: 'Salary Income',
      amount: 5000,
      frequency: 'monthly',
      type: 'income',
      isFixed: true,
      notes: 'important note',
    });
  });
});
