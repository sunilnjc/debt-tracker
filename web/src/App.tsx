import { useCallback, useEffect, useState } from 'react';
import { fetchDebts, fetchProjection, fetchRecurringItems, updateDebt, updateRecurringItem } from './api';
import type { Debt, Projection, RecurringItem } from './types';
import { ProjectionTable } from './components/ProjectionTable';
import { DebtDashboard } from './components/DebtDashboard';
import { RecurringItemsPanel } from './components/RecurringItemsPanel';
import './App.css';

export default function App() {
  const [projection, setProjection] = useState<Projection | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [p, d, r] = await Promise.all([fetchProjection(12), fetchDebts(), fetchRecurringItems()]);
      setProjection(p);
      setDebts(d);
      setRecurringItems(r);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleUpdateRecurringAmount = async (id: string, amount: number) => {
    await updateRecurringItem(id, { amount });
    await reload();
  };

  const handleUpdateDebtBalance = async (id: string, currentBalance: number) => {
    await updateDebt(id, { currentBalance });
    await reload();
  };

  if (error) {
    return (
      <main className="app">
        <p className="error">Failed to load: {error}</p>
      </main>
    );
  }

  if (!projection) {
    return (
      <main className="app">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="app">
      <h1>BudgetTracker</h1>
      <DebtDashboard
        debts={debts}
        summary={projection.summary}
        debtFreeMonth={projection.debtFreeMonth}
        onUpdateBalance={handleUpdateDebtBalance}
      />
      <RecurringItemsPanel items={recurringItems} onUpdateAmount={handleUpdateRecurringAmount} />
      <ProjectionTable projection={projection} />
    </main>
  );
}
