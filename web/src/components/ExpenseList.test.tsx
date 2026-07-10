import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseList } from './ExpenseList';
import * as api from '../api';

vi.mock('../api', () => ({ fetchExpenses: vi.fn(), deleteExpense: vi.fn() }));

const expenses = [
  { id: 'e1', amount: 70, category: 'other', date: '2026-07-10', note: "Noon gift for Trianna's bday" },
  { id: 'e2', amount: 45, category: 'grocery', date: '2026-07-15' },
];

describe('ExpenseList', () => {
  it('renders each expense including its note and a running total', async () => {
    vi.mocked(api.fetchExpenses).mockResolvedValue(expenses);
    render(<ExpenseList month="2026-07" />);

    expect(await screen.findByText("Noon gift for Trianna's bday")).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();
    expect(screen.getByText('grocery')).toBeInTheDocument();
    expect(screen.getByText(/2 expenses · 115 AED in 2026-07/)).toBeInTheDocument();
  });

  it('shows a message when the month has no expenses', async () => {
    vi.mocked(api.fetchExpenses).mockResolvedValue([]);
    render(<ExpenseList month="2027-01" />);
    expect(await screen.findByText('No expenses logged for 2027-01.')).toBeInTheDocument();
  });

  it('deletes an expense and notifies the parent', async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchExpenses).mockResolvedValue(expenses);
    vi.mocked(api.deleteExpense).mockResolvedValue(undefined);
    const onChanged = vi.fn();
    render(<ExpenseList month="2026-07" onChanged={onChanged} />);

    await screen.findByText("Noon gift for Trianna's bday");
    // After delete, the reload returns only the second expense.
    vi.mocked(api.fetchExpenses).mockResolvedValue([expenses[1]!]);
    await user.click(screen.getByLabelText('Delete expense e1'));

    expect(api.deleteExpense).toHaveBeenCalledWith('e1');
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('shows an error when the fetch fails', async () => {
    vi.mocked(api.fetchExpenses).mockImplementation(async () => {
      throw new Error('server down');
    });
    render(<ExpenseList month="2026-07" />);
    const el = await screen.findByText(/Failed to load/);
    expect(el).toHaveTextContent('Failed to load: server down');
  });
});
