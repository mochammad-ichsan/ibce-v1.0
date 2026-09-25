import { describe, expect, it } from "vitest";
import {
  analyzeSurvival,
  computeLogRank,
  selectPrimaryTumorExpression,
  type ClinicalObservation,
  type RnaObservation,
} from "./survival-analysis.js";

const sample = (index: number, type = "01") =>
  `TCGA-AB-${String(index).padStart(4, "0")}-${type}A`;

describe("IBCE exploratory overall-survival cohort", () => {
  it("keeps only primary-tumor samples and does not turn missing RNA into zero", () => {
    const rows: RnaObservation[] = [
      { sample: sample(1), pTPM: 0 },
      { sample: sample(1), pTPM: 0 },
      { sample: sample(2), pTPM: null },
      { sample: sample(3), pTPM: 2 },
      { sample: sample(3), pTPM: 4 },
      { sample: sample(4, "11"), pTPM: 5 },
      { sample: sample(5), pTPM: -1 },
    ];
    const { expressionByCase, quality } = selectPrimaryTumorExpression(rows);
    expect([...expressionByCase.values()]).toEqual([0]);
    expect(quality).toMatchObject({
      nExcludedNonPrimaryRnaRows: 1,
      nExcludedInvalidExpressionCases: 2,
      nExcludedDiscordantExpressionCases: 1,
      nCollapsedIdenticalDuplicateCases: 1,
      nEligibleCases: 1,
    });
  });

  it("uses the arithmetic median for even cohorts and reports event/censor counts", () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({
      sample: sample(index),
      pTPM: index + 1,
    }));
    const { expressionByCase, quality } = selectPrimaryTumorExpression(rows);
    const clinical: ClinicalObservation[] = rows.map((row, index) => ({
      caseBarcode: row.sample.slice(0, 12),
      vitalStatus: index % 2 ? "Alive" : "Dead",
      daysToDeath: index % 2 ? null : index + 10,
      daysToLastFollowUp: index % 2 ? index + 20 : null,
    }));
    const result = analyzeSurvival(expressionByCase, clinical, quality);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.medianExpression).toBe(5.5);
    expect(result.nHigh).toBe(5);
    expect(result.nLow).toBe(5);
    expect(result.quality).toMatchObject({
      nMatchedClinicalCases: 10,
      nAnalyzedCases: 10,
      nEvents: 5,
      nCensored: 5,
    });
    expect(result.logRankP).toBeNull(); // Fewer than five events in each group.
  });

  it("rejects an all-tied split rather than showing an empty comparison group", () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({
      sample: sample(index),
      pTPM: 1,
    }));
    const { expressionByCase, quality } = selectPrimaryTumorExpression(rows);
    const clinical: ClinicalObservation[] = rows.map((row) => ({
      caseBarcode: row.sample.slice(0, 12),
      vitalStatus: "Dead",
      daysToDeath: 100,
      daysToLastFollowUp: null,
    }));
    const result = analyzeSurvival(expressionByCase, clinical, quality);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("fewer than five");
  });

  it("excludes unknown status and invalid follow-up rather than treating them as censored", () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      sample: sample(index),
      pTPM: index,
    }));
    const { expressionByCase, quality } = selectPrimaryTumorExpression(rows);
    const clinical: ClinicalObservation[] = rows.map((row, index) => ({
      caseBarcode: row.sample.slice(0, 12),
      vitalStatus: index === 0 ? null : index === 11 ? "Dead" : "Alive",
      daysToDeath: index === 11 ? 0 : null,
      daysToLastFollowUp: 100,
    }));
    const result = analyzeSurvival(expressionByCase, clinical, quality);
    expect(result.quality).toMatchObject({
      nExcludedUnknownVitalStatus: 1,
      nExcludedInvalidFollowUp: 1,
      nAnalyzedCases: 10,
      nCensored: 10,
    });
    expect(result.ok).toBe(true);
  });

  it("matches the independent chi-square tail calculation for separated event times", () => {
    const high = Array.from({ length: 5 }, (_, index) => ({ time: index + 1, event: 1 }));
    const low = Array.from({ length: 5 }, (_, index) => ({ time: index + 6, event: 1 }));
    // Risk-set O=5, E=1.7718253968, V=1.0742591018;
    // chi-square(1) survival function = erfc(sqrt(9.7007428201 / 2)).
    expect(computeLogRank(high, low)).toBeCloseTo(0.00184193540162, 6);
  });
});