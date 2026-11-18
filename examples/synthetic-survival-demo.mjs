// Synthetic inputs only. TCGA-format labels exercise the existing parser;
// they are generated here and are not records of research participants.
import assert from 'node:assert/strict';
import { analyzeSurvival, computeLogRank, selectPrimaryTumorExpression } from '../artifacts/api-server/src/ibce/survival-analysis.ts';
import { computeKM, mergeKMSteps } from '../artifacts/ibios-tools/src/pages/ibios-tools/ibce/km-analysis.ts';

const rows = Array.from({ length: 10 }, (_, i) => ({
  sample: `TCGA-ZZ-${String(i).padStart(4, '0')}-01A`, pTPM: i + 1,
}));
const { expressionByCase, quality } = selectPrimaryTumorExpression(rows);
const clinical = rows.map((r, i) => ({
  caseBarcode: r.sample.slice(0, 12), vitalStatus: i % 2 ? 'Alive' : 'Dead',
  daysToDeath: i % 2 ? null : i + 10,
  daysToLastFollowUp: i % 2 ? i + 20 : null,
}));
const cohort = analyzeSurvival(expressionByCase, clinical, quality);
assert.equal(cohort.ok, true);
assert.equal(cohort.medianExpression, 5.5);
assert.equal(cohort.nHigh, 5);
assert.equal(cohort.nLow, 5);
assert.equal(cohort.quality.nEvents, 5);
assert.equal(cohort.quality.nCensored, 5);
assert.equal(cohort.logRankP, null); // Each group has fewer than five events.

const high = Array.from({ length: 5 }, (_, i) => ({ time: i + 1, event: 1 }));
const low = Array.from({ length: 5 }, (_, i) => ({ time: i + 6, event: 1 }));
const p = computeLogRank(high, low);
// Existing public fixture's reference value, not a new independent derivation.
assert.ok(p !== null && Math.abs(p - 0.00184193540162) < 1e-6);
const km = computeKM([{ time: 4, event: 1 }, { time: 12, event: 0 }]);
assert.equal(km.at(-1).time, 12);
assert.equal(km.at(-1).survival, 0.5);
const merged = mergeKMSteps(km, computeKM([{ time: 5, event: 1 }, { time: 8, event: 0 }]));
assert.equal(merged.at(-1).low, null);

const invalid = selectPrimaryTumorExpression([
  { sample: rows[0].sample, pTPM: null },
  { sample: rows[1].sample, pTPM: -1 },
  { sample: 'TCGA-ZZ-0002-11A', pTPM: 4 },
]);
assert.equal(invalid.expressionByCase.size, 0);
assert.equal(invalid.quality.nExcludedInvalidExpressionCases, 2);
assert.equal(invalid.quality.nExcludedNonPrimaryRnaRows, 1);
console.log('PASS: synthetic cohort, median, sparse-event gate, reference p-value, KM endpoints and invalid-input exclusions.');
console.log('Synthetic demonstration only; no biological or clinical validation.');
