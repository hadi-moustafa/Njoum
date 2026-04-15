// ============================================================
// Cycle Predictor — pure business logic, no DB calls here
// Prediction is done in the API layer; DB stores raw cycles only.
// ============================================================

export interface CycleRecord {
  start_date: string; // ISO date 'YYYY-MM-DD'
  end_date?: string;
}

export interface CyclePrediction {
  next_period_date: string;   // predicted start date
  cycle_length_days: number;
  period_length_days: number;
}

const DEFAULT_CYCLE  = 28;
const DEFAULT_PERIOD = 5;

/**
 * Given a list of past cycles (ascending by start_date),
 * predicts the next period start date and average cycle/period lengths.
 */
export function predictNextCycle(cycles: CycleRecord[]): CyclePrediction {
  if (cycles.length === 0) {
    // No history — return defaults
    const today = new Date();
    today.setDate(today.getDate() + DEFAULT_CYCLE);
    return {
      next_period_date:  today.toISOString().split('T')[0]!,
      cycle_length_days: DEFAULT_CYCLE,
      period_length_days: DEFAULT_PERIOD,
    };
  }

  // Average cycle length from gaps between consecutive start dates
  let totalCycle  = 0;
  let cycleCount  = 0;
  let totalPeriod = 0;
  let periodCount = 0;

  for (let i = 1; i < cycles.length; i++) {
    const prev = new Date(cycles[i - 1]!.start_date);
    const curr = new Date(cycles[i]!.start_date);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diff > 0 && diff < 60) { // sanity check
      totalCycle += diff;
      cycleCount++;
    }
  }

  for (const c of cycles) {
    if (c.end_date) {
      const s = new Date(c.start_date);
      const e = new Date(c.end_date);
      const len = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
      if (len > 0 && len < 15) {
        totalPeriod += len;
        periodCount++;
      }
    }
  }

  const avgCycle  = cycleCount  > 0 ? Math.round(totalCycle / cycleCount)   : DEFAULT_CYCLE;
  const avgPeriod = periodCount > 0 ? Math.round(totalPeriod / periodCount) : DEFAULT_PERIOD;

  const lastStart = new Date(cycles[cycles.length - 1]!.start_date);
  const predicted = new Date(lastStart);
  predicted.setDate(predicted.getDate() + avgCycle);

  return {
    next_period_date:  predicted.toISOString().split('T')[0]!,
    cycle_length_days: avgCycle,
    period_length_days: avgPeriod,
  };
}
