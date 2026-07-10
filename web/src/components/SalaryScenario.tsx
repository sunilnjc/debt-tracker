import { useEffect, useRef, useState } from 'react';
import { fetchScenarioProjection } from '../api';
import { monthsBetween } from '../monthDiff';

interface Props {
  currentSalary: number;
  realDebtFreeMonth: string | null;
}

const SLIDER_RANGE = 15000;
const SLIDER_STEP = 500;
const DEBOUNCE_MS = 300;

export function SalaryScenario({ currentSalary, realDebtFreeMonth }: Props) {
  const [salary, setSalary] = useState(currentSalary);
  const [scenarioDebtFreeMonth, setScenarioDebtFreeMonth] = useState<string | null>(realDebtFreeMonth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep in sync if the real salary/debt-free date changes underneath us
  // (e.g. after an inline edit elsewhere on the page).
  useEffect(() => {
    setSalary(currentSalary);
  }, [currentSalary]);

  useEffect(() => {
    if (salary === currentSalary) {
      setScenarioDebtFreeMonth(realDebtFreeMonth);
      setError(null);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetchScenarioProjection(12, { recurringItems: { salary: { amount: salary } } });
        setScenarioDebtFreeMonth(result.debtFreeMonth);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salary]);

  const delta =
    scenarioDebtFreeMonth && realDebtFreeMonth ? monthsBetween(scenarioDebtFreeMonth, realDebtFreeMonth) : 0;

  return (
    <section className="salary-scenario">
      <h2>What if my salary changed?</h2>
      <input
        type="range"
        min={currentSalary}
        max={currentSalary + SLIDER_RANGE}
        step={SLIDER_STEP}
        value={salary}
        onChange={(e) => setSalary(Number(e.target.value))}
        aria-label="Salary"
      />
      <p className="scenario-salary">{salary.toLocaleString('en-US')} AED / month</p>
      <p className="scenario-result">
        {loading ? (
          'Calculating…'
        ) : scenarioDebtFreeMonth ? (
          <>
            Debt-free by <strong>{scenarioDebtFreeMonth}</strong>
            {delta !== 0 && (
              <span className="scenario-delta">
                {' '}
                ({Math.abs(delta)} month{Math.abs(delta) === 1 ? '' : 's'} {delta > 0 ? 'earlier' : 'later'})
              </span>
            )}
          </>
        ) : (
          'Beyond horizon'
        )}
      </p>
      {error && <p className="error">Failed to load: {error}</p>}
    </section>
  );
}
