import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BudgetVsActual } from './BudgetVsActual';
import * as api from '../api';

vi.mock('../api', () => ({
  fetchBudgetVsActual: vi.fn(),
}));

describe('BudgetVsActual', () => {
  beforeEach(() => {
    vi.mocked(api.fetchBudgetVsActual).mockReset();
  });

  it('renders budgeted, actual, and delta for each category', async () => {
    vi.mocked(api.fetchBudgetVsActual).mockResolvedValue([
      { category: 'grocery', budgeted: 600, actual: 650 },
      { category: 'petrol', budgeted: 300, actual: 120 },
    ]);

    render(<BudgetVsActual />);

    expect(await screen.findByText('grocery')).toBeInTheDocument();
    expect(screen.getByText('50 over')).toBeInTheDocument();
    expect(screen.getByText('180 left')).toBeInTheDocument();
  });

  it('shows a message when there is no data for the month', async () => {
    vi.mocked(api.fetchBudgetVsActual).mockResolvedValue([]);
    render(<BudgetVsActual />);
    expect(await screen.findByText('No data for this month.')).toBeInTheDocument();
  });

  it('refetches when the month input changes', async () => {
    vi.mocked(api.fetchBudgetVsActual).mockResolvedValue([]);
    render(<BudgetVsActual />);

    await screen.findByText('No data for this month.');
    vi.mocked(api.fetchBudgetVsActual).mockClear();

    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-08' } });

    expect(api.fetchBudgetVsActual).toHaveBeenCalledWith('2026-08');
  });

  it('shows an error message when the fetch fails', async () => {
    vi.mocked(api.fetchBudgetVsActual).mockRejectedValue(new Error('server down'));
    render(<BudgetVsActual />);
    expect(await screen.findByText('Failed to load: server down')).toBeInTheDocument();
  });
});
