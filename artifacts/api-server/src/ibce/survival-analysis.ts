export interface RnaObservation {
  sample: string;
  pTPM: number | null;
}

export interface ClinicalObservation {
  caseBarcode: string;
  vitalStatus: string | null;
  daysToDeath: number | null;
  daysToLastFollowUp: number | null;
}

export interface SurvivalQuality {
  nSourceRnaRows: number;
  nExcludedNonPrimaryRnaRows: number;
  nExcludedInvalidExpressionCases: number;
  nExcludedDiscordantExpressionCases: number;
  nCollapsedIdenticalDuplicateCases: number;
  nEligibleCases: number;
  nMatchedClinicalCases: number;
  nExcludedUnknownVitalStatus: number;
  nExcludedInvalidFollowUp: number;
  nAnalyzedCases: number;
  nEvents: number;
  nCensored: number;
}

type SurvivalPoint = { time: number; event: number };

export function selectPrimaryTumorExpression(rows: RnaObservation[]) {
  const byCase = new Map<string, Array<number | null>>();
  const quality: SurvivalQuality = {
    nSourceRnaRows: rows.length,
    nExcludedNonPrimaryRnaRows: 0,
    nExcludedInvalidExpressionCases: 0,
    nExcludedDiscordantExpressionCases: 0,
    nCollapsedIdenticalDuplicateCases: 0,
    nEligibleCases: 0,
    nMatchedClinicalCases: 0,
    nExcludedUnknownVitalStatus: 0,
    nExcludedInvalidFollowUp: 0,
    nAnalyzedCases: 0,
    nEvents: 0,
    nCensored: 0,
  };

  for (const row of rows) {
    // TCGA sample-type 01 is primary solid tumor. Do not mix normal or
    // metastatic samples into a patient-level tumor-expression comparison.
    const sample = row.sample.toUpperCase();
    if (!/^TCGA-[A-Z0-9]{2}-[A-Z0-9]{4}-01[A-Z0-9](?:-|$)/.test(sample)) {
      quality.nExcludedNonPrimaryRnaRows++;
      continue;
    }
    const barcode = sample.slice(0, 12);
    const observations = byCase.get(barcode) ?? [];
    observations.push(row.pTPM);
    byCase.set(barcode, observations);
  }

  const expressionByCase = new Map<string, number>();
  for (const [barcode, observations] of byCase) {
    if (observations.some((value) => value === null || !Number.isFinite(value) || value < 0)) {
      quality.nExcludedInvalidExpressionCases++;
    } else if (observations.some((value) => value !== observations[0])) {
      quality.nExcludedDiscordantExpressionCases++;
    } else {
      if (observations.length > 1) quality.nCollapsedIdenticalDuplicateCases++;
      expressionByCase.set(barcode, observations[0]!);
    }
  }
  quality.nEligibleCases = expressionByCase.size;
  return { expressionByCase, quality };
}

export function analyzeSurvival(
  expressionByCase: Map<string, number>,
  clinicalRows: ClinicalObservation[],
  initialQuality: SurvivalQuality,
) {
  const quality = { ...initialQuality, nMatchedClinicalCases: clinicalRows.length };
  const joint: Array<SurvivalPoint & { expression: number }> = [];

  for (const row of clinicalRows) {
    const expression = expressionByCase.get(row.caseBarcode.toUpperCase());
    if (expression === undefined) continue;
    const status = row.vitalStatus?.trim().toLowerCase();
    if (status !== "alive" && status !== "dead") {
      quality.nExcludedUnknownVitalStatus++;
      continue;
    }
    const time = status === "dead" ? row.daysToDeath : row.daysToLastFollowUp;
    if (time === null || !Number.isFinite(time) || time <= 0) {
      quality.nExcludedInvalidFollowUp++;
      continue;
    }
    joint.push({ expression, time, event: status === "dead" ? 1 : 0 });
  }

  quality.nAnalyzedCases = joint.length;
  quality.nEvents = joint.filter((row) => row.event === 1).length;
  quality.nCensored = joint.length - quality.nEvents;
  if (joint.length < 10) {
    return { ok: false as const, reason: "At least 10 matched cases with valid overall-survival follow-up are required", quality };
  }

  const sorted = joint.map((row) => row.expression).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianExpression = sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
  const high = joint.filter((row) => row.expression >= medianExpression).map(({ time, event }) => ({ time, event }));
  const low = joint.filter((row) => row.expression < medianExpression).map(({ time, event }) => ({ time, event }));
  if (high.length < 5 || low.length < 5) {
    return { ok: false as const, reason: "Median split leaves fewer than five cases in one group", quality };
  }

  const highEvents = high.filter((row) => row.event === 1).length;
  const lowEvents = low.filter((row) => row.event === 1).length;
  // The curves remain descriptive when events are scarce. Avoid presenting an
  // unstable asymptotic comparison as a meaningful p-value.
  const logRankP = highEvents >= 5 && lowEvents >= 5 ? computeLogRank(high, low) : null;
  return {
    ok: true as const,
    high,
    low,
    medianExpression,
    nHigh: high.length,
    nLow: low.length,
    logRankP,
    quality,
  };
}

export function computeLogRank(high: SurvivalPoint[], low: SurvivalPoint[]): number | null {
  const eventTimes = [
    ...new Set([...high, ...low].filter((row) => row.event === 1).map((row) => row.time)),
  ].sort((a, b) => a - b);

  let observed = 0;
  let expected = 0;
  let variance = 0;
  for (const time of eventTimes) {
    const n1 = high.filter((row) => row.time >= time).length;
    const n2 = low.filter((row) => row.time >= time).length;
    const d1 = high.filter((row) => row.time === time && row.event === 1).length;
    const d2 = low.filter((row) => row.time === time && row.event === 1).length;
    const n = n1 + n2;
    const d = d1 + d2;
    if (n < 2) continue;
    observed += d1;
    expected += (d * n1) / n;
    variance += (d * n1 * n2 * (n - d)) / (n * n * (n - 1));
  }
  if (variance <= 0) return null;
  const chi2 = (observed - expected) ** 2 / variance;
  return Math.min(1, Math.max(0, erfc(Math.sqrt(chi2 / 2))));
}

function erfc(x: number): number {
  // Abramowitz and Stegun 7.1.26, approximate maximum absolute error 1.5e-7.
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const erfApprox = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t) * Math.exp(-x * x);
  return 1 - (x >= 0 ? erfApprox : -erfApprox);
}