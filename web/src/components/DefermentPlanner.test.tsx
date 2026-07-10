import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DefermentPlanner } from './DefermentPlanner';
import type { Deferment, RecurringItem } from '../types';

const loanEmi: RecurringItem = {
  id: 'loan-emi', name: 'Loan EMI', amount: -15420, category: 'loan_emi',
  frequency: 'monthly', startMonth: '2026-07', endMonth: null,
};

const existing: Deferment[] = [
  { id: 'def-feb27', targetItemId: 'loan-emi', month: '2027-02', fee: 105, status: 'planned' },
  { id: 'def-apr27', targetItemId: 'loan-emi', month: '2027-04', fee: 105, status: 'planned' },
];

describe('DefermentPlanner', () => {
  it('lists existing deferments sorted by month', () => {
    render(<DefermentPlanner deferments={existing} loanItems={[loanEmi]} onAddDeferment={vi.fn()} />);
    const items = screen.getAllByRole('listitem').map((el) => el.textContent);
    expect(items[0]).toContain('2027-02');
    expect(items[1]).toContain('2027-04');
  });

  it('shows a message when there are no deferments', () => {
    render(<DefermentPlanner deferments={[]} loanItems={[loanEmi]} onAddDeferment={vi.fn()} />);
    expect(screen.getByText('No deferments planned.')).toBeInTheDocument();
  });

  it('submits a new deferment with a generated id and default fee', async () => {
    const user = userEvent.setup();
    const onAddDeferment = vi.fn().mockResolvedValue(undefined);
    render(<DefermentPlanner deferments={[]} loanItems={[loanEmi]} onAddDeferment={onAddDeferment} />);

    fireEvent.change(screen.getByLabelText('Deferment month'), { target: { value: '2028-06' } });
    await user.click(screen.getByRole('button', { name: 'Add deferment' }));

    expect(onAddDeferment).toHaveBeenCalledWith({
      id: 'def-2028-06',
      targetItemId: 'loan-emi',
      month: '2028-06',
      fee: 105,
      status: 'planned',
    });
  });

  it('rejects submission without a month', async () => {
    const user = userEvent.setup();
    const onAddDeferment = vi.fn();
    render(<DefermentPlanner deferments={[]} loanItems={[loanEmi]} onAddDeferment={onAddDeferment} />);

    await user.click(screen.getByRole('button', { name: 'Add deferment' }));

    expect(onAddDeferment).not.toHaveBeenCalled();
    expect(screen.getByText('pick a month')).toBeInTheDocument();
  });

  it('surfaces the server rejection message (e.g. the adjacent-month rule)', async () => {
    const user = userEvent.setup();
    const onAddDeferment = vi.fn().mockRejectedValue(
      new Error('2027-03 is adjacent to an existing deferment in 2027-02 for loan-emi — deferments must be non-consecutive'),
    );
    render(<DefermentPlanner deferments={existing} loanItems={[loanEmi]} onAddDeferment={onAddDeferment} />);

    fireEvent.change(screen.getByLabelText('Deferment month'), { target: { value: '2027-03' } });
    await user.click(screen.getByRole('button', { name: 'Add deferment' }));

    expect(await screen.findByText(/must be non-consecutive/)).toBeInTheDocument();
  });
});
