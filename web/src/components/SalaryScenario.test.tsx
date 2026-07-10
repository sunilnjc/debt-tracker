import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SalaryScenario } from './SalaryScenario';
import * as api from '../api';

vi.mock('../api', () => ({
  fetchScenarioProjection: vi.fn(),
}));

describe('SalaryScenario', () => {
  beforeEach(() => {
    vi.mocked(api.fetchScenarioProjection).mockReset();
  });

  it('shows the real debt-free month at the starting salary with no scenario call', () => {
    render(<SalaryScenario currentSalary={32000} realDebtFreeMonth="2027-03" />);
    expect(screen.getByText('2027-03')).toBeInTheDocument();
    expect(api.fetchScenarioProjection).not.toHaveBeenCalled();
  });

  it('calls the scenario endpoint with the overridden salary and shows an earlier date', async () => {
    vi.mocked(api.fetchScenarioProjection).mockResolvedValue({
      months: [],
      debtFreeMonth: '2026-10',
      summary: { totalDebtAed: 53500, clearMonthByDebt: {} },
    });
    render(<SalaryScenario currentSalary={32000} realDebtFreeMonth="2027-03" />);

    fireEvent.change(screen.getByLabelText('Salary'), { target: { value: '40000' } });

    await waitFor(() =>
      expect(api.fetchScenarioProjection).toHaveBeenCalledWith(12, {
        recurringItems: { salary: { amount: 40000 } },
      }),
    );
    expect(await screen.findByText('2026-10')).toBeInTheDocument();
    expect(await screen.findByText(/5 months earlier/)).toBeInTheDocument();
  });

  it('reverts to the real date when the slider returns to the starting salary', async () => {
    vi.mocked(api.fetchScenarioProjection).mockResolvedValue({
      months: [],
      debtFreeMonth: '2026-10',
      summary: { totalDebtAed: 53500, clearMonthByDebt: {} },
    });
    render(<SalaryScenario currentSalary={32000} realDebtFreeMonth="2027-03" />);

    fireEvent.change(screen.getByLabelText('Salary'), { target: { value: '40000' } });
    await screen.findByText('2026-10');

    fireEvent.change(screen.getByLabelText('Salary'), { target: { value: '32000' } });
    expect(await screen.findByText('2027-03')).toBeInTheDocument();
  });

  it('shows an error message if the scenario call fails', async () => {
    vi.mocked(api.fetchScenarioProjection).mockRejectedValue(new Error('server down'));
    render(<SalaryScenario currentSalary={32000} realDebtFreeMonth="2027-03" />);

    fireEvent.change(screen.getByLabelText('Salary'), { target: { value: '40000' } });

    expect(await screen.findByText('Failed to load: server down')).toBeInTheDocument();
  });
});
