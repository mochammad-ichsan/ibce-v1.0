# Isolated synthetic demonstration

## Scope and dependencies

Requires Node.js 24.x with native TypeScript type stripping. No npm install, credentials, database, application server, downloaded dataset or network request is needed during execution. This demonstration imports already-public pure modules; it does not extract or release additional private source.

```sh
node examples/synthetic-survival-demo.mjs
node --test artifacts/ibios-tools/src/pages/ibios-tools/ibce/km-analysis.test.mjs
```

Run from the repository root. Do not attempt to start the entire source-only application.

## Inputs and expected results

All arrays are generated in the demonstration; there is no random sampling, so no random seed is needed. TCGA-shaped labels are artificial parser fixtures, not patient identifiers.

| Assertion | Expected |
|---|---|
| Generated expression values | Integers 1 through 10 |
| Arithmetic median | 5.5 |
| High / low group sizes | 5 / 5 |
| Events / censored | 5 / 5 |
| Cohort log-rank result | null because neither group meets the event gate |
| Separate ten-event fixture | Approximately 0.00184193540162, absolute tolerance 0.000001 |
| Example KM final time / survival | 12 / 0.5 |
| Curve past the other group's observed follow-up | Other group becomes null |
| Invalid synthetic observations | Excluded with explicit counts |

Successful execution prints two lines beginning `PASS: synthetic cohort` and `Synthetic demonstration only`. The existing KM test file has three boundary tests. Assertions throw and produce a nonzero exit on failure.

The reference p-value is inherited from the existing public test fixture. It is not an independently recomputed statistical reference in this demonstration. No real gene, biological association, clinical result or AI interpretation is produced.

## Separate v1.1.1 numerical reference

`python3 examples/verify-numerical-reference.py` compares three explicitly synthetic [fixtures](numerical-reference-fixtures.json) against `scipy.stats.logrank`. It requires Python with SciPy providing that API and NumPy already available, plus Node.js 24; it performs no package installation. It fails explicitly if dependencies are missing. This optional reference is not required by the Node-only demonstration or the manual workflow. See exact versions, outputs and tolerance in the [reference report](../docs/portfolio-audit/NUMERICAL_REFERENCE.md).

This check calls the unchanged public `computeLogRank` directly, not the live API, source-data pipeline, clinical eligibility logic or application event gate. It does not independently reproduce the historical ten-gene comparison.
