import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SavingsTracker } from './SavingsTracker';
import * as api from '../api';

vi.mock('../api', () => ({ fetchSavings: vi.fn() }));

const forecast = {
  entries: [
    { target: { id: 'stage-1', label: 'Emergency buffer', amount: 5000 }, achievedMonth: '2027-04' },
    { target: { id: 'stage-4', label: '~3 months of expenses', amount: 72000 }, achievedMonth: null },
  ],
  finalBuffer: 60000,
  debtFreeMonth: '2027-03',
};

describe('SavingsTracker', () => {
  // Each test sets its own fetchSavings behavior; a beforeEach mockReset here
  // triggers a spurious unhandled-rejection report in the error case.
  it('renders each stage with its projected achievement month', async () => {
    vi.mocked(api.fetchSavings).mockResolvedValue(forecast);
    render(<SavingsTracker />);

    expect(await screen.findByText(/Emergency buffer/)).toBeInTheDocument();
    expect(screen.getByText('2027-04')).toBeInTheDocument();
    expect(screen.getByText('beyond horizon')).toBeInTheDocument();
  });

  it('shows the projected final buffer and debt-free month', async () => {
    vi.mocked(api.fetchSavings).mockResolvedValue(forecast);
    render(<SavingsTracker />);

    expect(await screen.findByText(/60,000 AED saved/)).toBeInTheDocument();
    expect(screen.getByText(/debt-free 2027-03/)).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', async () => {
    // async-throw defers the rejected-promise creation to call time so the
    // component's await attaches its handler in the same tick (no eager
    // unhandled-rejection window like mockRejectedValue produces here).
    vi.mocked(api.fetchSavings).mockImplementation(async () => {
      throw new Error('server down');
    });
    render(<SavingsTracker />);
    const errorEl = await screen.findByText(/Failed to load/);
    expect(errorEl).toHaveTextContent('Failed to load: server down');
  });
});
