export interface KMStep {
  time: number;
  survival: number;
  nAtRisk: number;
}

export function computeKM(data: { time: number; event: number }[]): KMStep[] {
  const sorted = [...data].sort((a, b) => a.time - b.time);
  let survival = 1;
  let nAtRisk = sorted.length;
  const steps: KMStep[] = [{ time: 0, survival: 1, nAtRisk }];
  let i = 0;
  while (i < sorted.length) {
    const time = sorted[i]!.time;
    let events = 0;
    let censored = 0;
    while (i < sorted.length && sorted[i]!.time === time) {
      if (sorted[i]!.event === 1) events++;
      else censored++;
      i++;
    }
    if (events > 0) {
      survival *= 1 - events / nAtRisk;
      steps.push({ time, survival: Math.max(0, survival), nAtRisk });
    } else if (i === sorted.length) {
      // Keep the estimate flat to the final censoring time.
      steps.push({ time, survival, nAtRisk });
    }
    nAtRisk -= events + censored;
  }
  return steps;
}

// Terminate each series at its own last observed time. Extending it to the
// other group's last follow-up would imply observations that were not made.
export function mergeKMSteps(
  high: KMStep[],
  low: KMStep[],
): { time: number; high: number | null; low: number | null }[] {
  const allTimes = [...new Set([...high.map(step => step.time), ...low.map(step => step.time)])]
    .sort((a, b) => a - b);
  const highEnd = high[high.length - 1]?.time ?? 0;
  const lowEnd = low[low.length - 1]?.time ?? 0;
  let prevHigh = 1;
  let prevLow = 1;
  return allTimes.map(time => {
    const highStep = high.find(step => step.time === time);
    const lowStep = low.find(step => step.time === time);
    if (highStep) prevHigh = highStep.survival;
    if (lowStep) prevLow = lowStep.survival;
    return {
      time,
      high: time <= highEnd ? prevHigh : null,
      low: time <= lowEnd ? prevLow : null,
    };
  });
}