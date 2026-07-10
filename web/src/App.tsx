import { useCallback, useEffect, useState } from 'react';
import {
  closeMonth,
  createExpense,
  fetchDebtPayments,
  fetchDebts,
  fetchMonthCloses,
  fetchProjection,
  fetchRecurringItems,
  logDebtPayment,
  updateDebt,
  updateRecurringItem,
} from './api';
import type { Debt, DebtPaymentRecord, Expense, MonthClose, Projection, RecurringItem } from './types';
import { ProjectionTable } from './components/ProjectionTable';
import { DebtDashboard } from './components/DebtDashboard';
import { RecurringItemsPanel } from './components/RecurringItemsPanel';
import { ExpenseEntryForm } from './components/ExpenseEntryForm';
import { BudgetVsActual } from './components/BudgetVsActual';
import { SalaryScenario } from './components/SalaryScenario';
import './App.css';

export default function App() {
  const [projection, setProjection] = useState<Projection | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [monthCloses, setMonthCloses] = useState<MonthClose[]>([]);
  const [paymentsByDebt, setPaymentsByDebt] = useState<Record<string, DebtPaymentRecord[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [expenseVersion, setExpenseVersion] = useState(0);

  const reload = useCallback(async () => {
    try {
      const [p, d, r, c] = await Promise.all([
        fetchProjection(12),
        fetchDebts(),
        fetchRecurringItems(),
        fetchMonthCloses(),
      ]);
      const paymentLists = await Promise.all(d.map((debt) => fetchDebtPayments(debt.id)));
      const nextPaymentsByDebt: Record<string, DebtPaymentRecord[]> = {};
      d.forEach((debt, i) => {
        nextPaymentsByDebt[debt.id] = paymentLists[i];
      });

      setProjection(p);
      setDebts(d);
      setRecurringItems(r);
      setMonthCloses(c);
      setPaymentsByDebt(nextPaymentsByDebt);
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

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    await createExpense(expense);
    setExpenseVersion((v) => v + 1);
  };

  const handleCloseMonth = async (month: string) => {
    await closeMonth(month);
    await reload();
  };

  const handleLogPayment = async (debtId: string, amount: number, date: string) => {
    await logDebtPayment(debtId, { amount, date });
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
        paymentsByDebt={paymentsByDebt}
        onLogPayment={handleLogPayment}
      />
      <SalaryScenario
        currentSalary={recurringItems.find((item) => item.id === 'salary')?.amount ?? 0}
        realDebtFreeMonth={projection.debtFreeMonth}
      />
      <RecurringItemsPanel items={recurringItems} onUpdateAmount={handleUpdateRecurringAmount} />
      <section className="expense-panel">
        <h2>Log an expense</h2>
        <ExpenseEntryForm
          fixedCostItems={recurringItems.filter((item) => item.category === 'fixed_cost')}
          onSubmit={handleAddExpense}
        />
      </section>
      <BudgetVsActual refreshSignal={expenseVersion} />
      <ProjectionTable projection={projection} monthCloses={monthCloses} onCloseMonth={handleCloseMonth} />
    </main>
  );
}
