import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseEntryForm } from './ExpenseEntryForm';
import type { RecurringItem } from '../types';

const groceryItem: RecurringItem = {
  id: 'grocery',
  name: 'Grocery',
  amount: -600,
  category: 'fixed_cost',
  frequency: 'monthly',
  startMonth: '2026-07',
  endMonth: null,
};

describe('ExpenseEntryForm', () => {
  it('submits amount, category, date, and note, then clears for the next entry', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ExpenseEntryForm fixedCostItems={[groceryItem]} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Amount'), '45');
    await user.selectOptions(screen.getByLabelText('Category'), 'grocery');
    await user.type(screen.getByLabelText('Note'), 'extra groceries');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 45, category: 'grocery', note: 'extra groceries' }),
    );
    expect(screen.getByLabelText('Amount')).toHaveValue('');
    expect(screen.getByLabelText('Note')).toHaveValue('');
  });

  it('rejects a non-positive amount without calling onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExpenseEntryForm fixedCostItems={[groceryItem]} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Amount'), '0');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('enter a positive amount')).toBeInTheDocument();
  });

  it('surfaces a failed submit as an error and keeps the entered amount', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('network down'));
    render(<ExpenseEntryForm fixedCostItems={[groceryItem]} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Amount'), '45');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(await screen.findByText('network down')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toHaveValue('45');
  });

  it('defaults category to "other" when there are no fixed-cost items', () => {
    render(<ExpenseEntryForm fixedCostItems={[]} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Category')).toHaveValue('other');
  });
});
