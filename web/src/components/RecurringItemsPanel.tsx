import type { RecurringItem } from '../types';
import { EditableAmount } from './EditableAmount';

interface Props {
  items: RecurringItem[];
  onUpdateAmount: (id: string, amount: number) => Promise<void>;
}

export function RecurringItemsPanel({ items, onUpdateAmount }: Props) {
  return (
    <section className="recurring-panel">
      <h2>Monthly items</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <span className="item-name">{item.name}</span>
            <EditableAmount value={item.amount} onSave={(next) => onUpdateAmount(item.id, next)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
