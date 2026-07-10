import { useRef, useState } from 'react';
import type { RecurringItem } from '../types';

interface Props {
  fixedCostItems: RecurringItem[];
  onSubmit: (expense: { amount: number; category: string; date: string; note?: string }) => Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ExpenseEntryForm({ fixedCostItems, onSubmit }: Props) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(fixedCostItems[0]?.id ?? 'other');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('enter a positive amount');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ amount: parsed, category, date, note: note || undefined });
      setAmount('');
      setNote('');
      amountRef.current?.focus();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <input
        ref={amountRef}
        type="text"
        inputMode="decimal"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        aria-label="Amount"
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
        {fixedCostItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
        <option value="other">Other</option>
      </select>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Date"
      />
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        aria-label="Note"
      />
      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Add'}
      </button>
      {error && <span className="edit-error">{error}</span>}
    </form>
  );
}
