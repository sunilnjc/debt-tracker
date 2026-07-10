import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpendingTrends } from './SpendingTrends';
import * as api from '../api';

vi.mock('../api', () => ({ fetchSpendingTrends: vi.fn() }));

const trends = {
  months: ['2026-07', '2026-08'],
  categories: [
    { category: 'grocery', totals: [650, 300], total: 950 },
    { category: 'petrol', totals: [120, 0], total: 120 },
  ],
};

describe('SpendingTrends', () => {
  it('renders a category × month grid with totals', async () => {
    vi.mocked(api.fetchSpendingTrends).mockResolvedValue(trends);
    render(<SpendingTrends />);

    expect(await screen.findByText('grocery')).toBeInTheDocument();
    expect(screen.getByText('650')).toBeInTheDocument();
    expect(screen.getByText('950')).toBeInTheDocument();
    expect(screen.getByText('petrol')).toBeInTheDocument();
    // month headers
    expect(screen.getByText('2026-07')).toBeInTheDocument();
    expect(screen.getByText('2026-08')).toBeInTheDocument();
  });

  it('shows a message when the range has no expenses', async () => {
    vi.mocked(api.fetchSpendingTrends).mockResolvedValue({ months: ['2027-01'], categories: [] });
    render(<SpendingTrends />);
    expect(await screen.findByText('No expenses logged in this range.')).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', async () => {
    vi.mocked(api.fetchSpendingTrends).mockImplementation(async () => {
      throw new Error('server down');
    });
    render(<SpendingTrends />);
    const el = await screen.findByText(/Failed to load/);
    expect(el).toHaveTextContent('Failed to load: server down');
  });
});
