import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DebtDashboard } from './DebtDashboard';
import type { Debt, DebtPaymentRecord } from '../types';

const shruthi: Debt = {
  id: 'shruthi', creditor: 'Shruthi', originalAmount: 20000, currentBalance: 15892,
  priority: 1, currency: 'AED', fxRate: null,
};

describe('DebtDashboard overall progress bar', () => {
  it('shows the paid-off percentage across all debts', () => {
    render(
      <DebtDashboard
        debts={[shruthi]}
        summary={{ totalDebtAed: 15892, clearMonthByDebt: {} }}
        debtFreeMonth="2027-03"
        onUpdateBalance={vi.fn()}
        paymentsByDebt={{}}
        onLogPayment={vi.fn()}
      />,
    );
    // (20000 - 15892) / 20000 = 20.54% -> rounds to 21%
    expect(screen.getByText('21% paid off')).toBeInTheDocument();
  });
});

describe('DebtDashboard payment logging', () => {
  it('logs a payment via the form, calling onLogPayment with the debt id, amount, and date', async () => {
    const user = userEvent.setup();
    const onLogPayment = vi.fn().mockResolvedValue(undefined);
    render(
      <DebtDashboard
        debts={[shruthi]}
        summary={{ totalDebtAed: 15892, clearMonthByDebt: {} }}
        debtFreeMonth="2027-03"
        onUpdateBalance={vi.fn()}
        paymentsByDebt={{}}
        onLogPayment={onLogPayment}
      />,
    );

    await user.type(screen.getByLabelText('Payment amount for shruthi'), '1000');
    await user.click(screen.getByRole('button', { name: 'Log payment' }));

    expect(onLogPayment).toHaveBeenCalledWith('shruthi', 1000, expect.any(String));
  });

  it('rejects a non-positive payment amount without calling onLogPayment', async () => {
    const user = userEvent.setup();
    const onLogPayment = vi.fn();
    render(
      <DebtDashboard
        debts={[shruthi]}
        summary={{ totalDebtAed: 15892, clearMonthByDebt: {} }}
        debtFreeMonth="2027-03"
        onUpdateBalance={vi.fn()}
        paymentsByDebt={{}}
        onLogPayment={onLogPayment}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Log payment' }));

    expect(onLogPayment).not.toHaveBeenCalled();
    expect(screen.getByText('enter a positive amount')).toBeInTheDocument();
  });

  it('shows the most recent payment history entries', () => {
    const payments: DebtPaymentRecord[] = [
      { id: 'p1', debtId: 'shruthi', amount: 4108, date: '2026-07-31' },
      { id: 'p2', debtId: 'shruthi', amount: 3890, date: '2026-08-31' },
    ];
    render(
      <DebtDashboard
        debts={[shruthi]}
        summary={{ totalDebtAed: 15892, clearMonthByDebt: {} }}
        debtFreeMonth="2027-03"
        onUpdateBalance={vi.fn()}
        paymentsByDebt={{ shruthi: payments }}
        onLogPayment={vi.fn()}
      />,
    );

    expect(screen.getByText('2026-08-31: 3,890')).toBeInTheDocument();
    expect(screen.getByText('2026-07-31: 4,108')).toBeInTheDocument();
  });

  it('surfaces an error from onLogPayment without crashing', async () => {
    const user = userEvent.setup();
    const onLogPayment = vi.fn().mockRejectedValue(new Error('exceeds balance'));
    render(
      <DebtDashboard
        debts={[shruthi]}
        summary={{ totalDebtAed: 15892, clearMonthByDebt: {} }}
        debtFreeMonth="2027-03"
        onUpdateBalance={vi.fn()}
        paymentsByDebt={{}}
        onLogPayment={onLogPayment}
      />,
    );

    await user.type(screen.getByLabelText('Payment amount for shruthi'), '999999');
    await user.click(screen.getByRole('button', { name: 'Log payment' }));

    expect(await screen.findByText('exceeds balance')).toBeInTheDocument();
  });
});
