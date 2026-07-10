import { useState } from 'react';

interface Props {
  value: number;
  onSave: (next: number) => Promise<void>;
}

/** Click a value to edit it; Enter saves, Esc cancels, blur discards the draft. */
export function EditableAmount({ value, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <span
        className="editable-amount"
        onClick={() => {
          setDraft(String(value));
          setError(null);
          setEditing(true);
        }}
        title="Click to edit"
      >
        {value.toLocaleString('en-US')}
      </span>
    );
  }

  const commit = async () => {
    const next = Number(draft);
    if (!Number.isFinite(next)) {
      setError('not a number');
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <span className="editable-amount-editing">
      <input
        autoFocus
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        onBlur={() => setEditing(false)}
      />
      {error && <span className="edit-error">{error}</span>}
    </span>
  );
}
