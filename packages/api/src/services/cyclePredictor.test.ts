import { predictNextCycle, CycleRecord } from './cyclePredictor';

describe('predictNextCycle', () => {
  it('returns defaults for empty cycle list', () => {
    const result = predictNextCycle([]);
    expect(result.cycle_length_days).toBe(28);
    expect(result.period_length_days).toBe(5);
    expect(result.next_period_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('predicts next cycle from a single entry using defaults', () => {
    const cycles: CycleRecord[] = [{ start_date: '2026-03-01' }];
    const result = predictNextCycle(cycles);
    // With one record, no cycle gap can be computed → defaults to 28
    expect(result.cycle_length_days).toBe(28);
    // Predicted date should be 28 days after 2026-03-01
    expect(result.next_period_date).toBe('2026-03-29');
  });

  it('computes average cycle length from two cycles', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-01-01' },
      { start_date: '2026-01-29' }, // 28-day gap
    ];
    const result = predictNextCycle(cycles);
    expect(result.cycle_length_days).toBe(28);
    expect(result.next_period_date).toBe('2026-02-26');
  });

  it('averages multiple cycles correctly', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-01-01' },
      { start_date: '2026-01-31' }, // 30-day gap
      { start_date: '2026-03-02' }, // 30-day gap
    ];
    const result = predictNextCycle(cycles);
    expect(result.cycle_length_days).toBe(30);
  });

  it('computes average period length from end dates', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-01-01', end_date: '2026-01-05' }, // 5 days
      { start_date: '2026-01-29', end_date: '2026-02-02' }, // 5 days
    ];
    const result = predictNextCycle(cycles);
    expect(result.period_length_days).toBe(5);
  });

  it('ignores outlier gaps (>= 60 days) in cycle average', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-01-01' },
      { start_date: '2026-04-01' }, // 90-day gap — outlier, ignored
      { start_date: '2026-04-29' }, // 28-day gap
    ];
    const result = predictNextCycle(cycles);
    // Only the 28-day gap counts
    expect(result.cycle_length_days).toBe(28);
  });

  it('returns ISO date string format', () => {
    const cycles: CycleRecord[] = [{ start_date: '2026-01-01' }, { start_date: '2026-01-29' }];
    expect(predictNextCycle(cycles).next_period_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles cycles without end dates (defaults period length)', () => {
    const cycles: CycleRecord[] = [
      { start_date: '2026-01-01' },
      { start_date: '2026-01-29' },
    ];
    expect(predictNextCycle(cycles).period_length_days).toBe(5);
  });
});
