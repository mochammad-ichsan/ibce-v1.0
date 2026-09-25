import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeKM, mergeKMSteps } from './km-analysis.ts';

describe('Kaplan-Meier chart boundaries', () => {
  it('keeps the curve flat through the final censoring time', () => {
    assert.deepEqual(computeKM([
      { time: 4, event: 1 },
      { time: 4, event: 0 },
      { time: 12, event: 0 },
    ]), [
      { time: 0, survival: 1, nAtRisk: 3 },
      { time: 4, survival: 1 - 1 / 3, nAtRisk: 3 },
      { time: 12, survival: 1 - 1 / 3, nAtRisk: 1 },
    ]);
  });

  it('shows an all-censored group up to its last observation', () => {
    assert.deepEqual(computeKM([
      { time: 3, event: 0 },
      { time: 9, event: 0 },
    ]), [
      { time: 0, survival: 1, nAtRisk: 2 },
      { time: 9, survival: 1, nAtRisk: 1 },
    ]);
  });

  it('does not extend either group beyond its observed follow-up', () => {
    const high = computeKM([{ time: 4, event: 1 }, { time: 12, event: 0 }]);
    const low = computeKM([{ time: 5, event: 1 }, { time: 8, event: 0 }]);
    assert.deepEqual(mergeKMSteps(high, low), [
      { time: 0, high: 1, low: 1 },
      { time: 4, high: 0.5, low: 1 },
      { time: 5, high: 0.5, low: 0.5 },
      { time: 8, high: 0.5, low: 0.5 },
      { time: 12, high: 0.5, low: null },
    ]);
  });
});