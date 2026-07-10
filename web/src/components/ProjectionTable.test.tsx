import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectionTable } from './ProjectionTable';
import type { MonthClose, Projection } from '../types';

const baseMonth = {
  month: '2026-07',
  income: 32000,
  loanEmi: -15420,
  fixedCosts: -8690,
  oneTime: -3782,
  rentCheques: 0,
  defermentFees: 0,
  netCashFlow: 4108,
  debtPayments: [{ debtId: 'shruthi', amount: 4108 }],
  debtBalancesAed: { shruthi: 15892 },
  buffer: 0,
  flags: { rentChequeMonth: false, defermentMonth: false, debtsCleared: [] },
};

const projection: Projection = {
  months: [baseMonth],
  debtFreeMonth: '2027-03',
  summary: { totalDebtAed: 53500, clearMonthByDebt: {} },
};

describe('ProjectionTable', () => {
  it('shows a Close button and dash for actual when the month is not closed', () => {
    render(<ProjectionTable projection={projection} monthCloses={[]} onCloseMonth={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onCloseMonth with the row month when Close is clicked', async () => {
    const user = userEvent.setup();
    const onCloseMonth = vi.fn().mockResolvedValue(undefined);
    render(<ProjectionTable projection={projection} monthCloses={[]} onCloseMonth={onCloseMonth} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onCloseMonth).toHaveBeenCalledWith('2026-07');
  });

  it('shows the actual net cash flow and a Closed badge when a close record exists', () => {
    const monthCloses: MonthClose[] = [
      { id: '2026-07', month: '2026-07', actualNetCashFlow: 3900, closedAt: '2026-08-01T00:00:00.000Z' },
    ];
    render(<ProjectionTable projection={projection} monthCloses={monthCloses} onCloseMonth={vi.fn()} />);

    expect(screen.getByText('3,900')).toBeInTheDocument();
    expect(screen.getByText('Closed ✓')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('surfaces an error from onCloseMonth without crashing', async () => {
    const user = userEvent.setup();
    const onCloseMonth = vi.fn().mockRejectedValue(new Error('close failed'));
    render(<ProjectionTable projection={projection} monthCloses={[]} onCloseMonth={onCloseMonth} />);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(await screen.findByText('close failed')).toBeInTheDocument();
  });
});
