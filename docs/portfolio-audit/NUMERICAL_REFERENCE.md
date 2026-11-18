# Independent synthetic numerical reference, separate from historical claims

Date: 2026-11-18. Reference code: [verify-numerical-reference.py](../../examples/verify-numerical-reference.py). Inputs: [three synthetic fixtures](../../examples/numerical-reference-fixtures.json). Target: already-public, unchanged `computeLogRank`, imported directly by a Node subprocess.

## Historical evidence audit

The original README reports a SciPy 1.17.1 comparison for ten live gene cohorts, seven displayed p-values differing by less than 0.0000002 and three withheld p-values. The selected public source and v1.1 evidence do not supply exact historical cohort inputs, a dated execution record, the original reference script or raw outputs.

**HISTORICAL_REPORTED; execution NOT_RUN.** No live API or cohort was accessed to substitute a new dataset for the missing historical inputs. The original text remains preserved but labeled. Reproducing a few synthetic values does not reconstruct that ten-gene report.

## New synthetic cross-implementation check

Executed with Node.js **v24.22.3**, Python **3.11.14**, SciPy **1.17.1**, NumPy **2.4.6**. Command: `python3 examples/verify-numerical-reference.py`. Exit **0**; stderr empty. Full UTC timing/stdout in [runtime record](evidence/runtime-execution.json).

The reference uses `scipy.stats.logrank` with `CensoredData(uncensored=..., right=...)`, its default two-sided comparison, and the same generated event/censor times supplied to the unchanged IBCE function. Inputs include separated events, tied events with censoring, and symmetric groups. No patient, gene-cohort or random input is used; no seed is required.

| Synthetic fixture | IBCE p | SciPy p | Absolute difference | Absolute tolerance | Result |
|---|---|---|---|---|---|
| separated_events | 0.0018420706910409201 | 0.0018419354016198002 | 1.3528942111994818e-7 | 2e-7 | PASS |
| tied_events_and_censoring | 0.5669133057284368 | 0.5669133801667261 | 7.443828931030794e-8 | 2e-7 | PASS |
| symmetric_groups | 0.999999999 | 1.0 | 9.999999717180685e-10 | 2e-7 | PASS |

The source uses an approximate complementary error function with a stated approximate maximum absolute error of 1.5e-7. A preselected **2e-7 absolute p-value tolerance** allows for that approximation and floating-point effects; it is not an equality guarantee or a relative-error standard for tiny p-values. Existing tests/demo use their original looser assertions and are not silently tightened or changed.

The symmetric result illustrates that the approximation is not exactly 1 even when the reference is 1; this was reported, not fixed. No production algorithm was modified.

## Meaning and limits of independence

**INDEPENDENTLY_VERIFIED** here means bounded comparison with a separate numerical implementation (SciPy), not independent human authorship, peer review, all-input equivalence or validation of the statistical design. The same AI-assisted remediation prepared the harness and executed it.

This check does not exercise the full application, cohort assembly, five-event display gate, ingestion, units, confounding, multiplicity or historical live cohorts. It establishes no biological or clinical validity.
