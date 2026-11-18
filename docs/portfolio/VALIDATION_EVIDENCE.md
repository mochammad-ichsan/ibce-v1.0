# Verification and scientific validation evidence

Audit date: 2026-11-18. Provenance statuses from the [contribution record](CONTRIBUTIONS.md#evidence-status-definitions) are separate from execution outcomes and scientific validation. No status is an overall certification.

| Category | Evidence and scope | Execution | Provenance/status | Limits |
|---|---|---|---|---|
| Software functionality | Selected public source inspection and retained public UI capture | DOCUMENTED inspection; full application NOT_RUN | DOCUMENTED | Snapshot remains host-dependent and non-runnable as a full application |
| Runtime reproducibility | Node 24 isolated synthetic demo and three existing Node KM tests | Exact outputs, exits and versions in [QA](../portfolio-audit/QUALITY_ASSURANCE.md) | DOCUMENTED | No host services, data or package installation needed; not integration coverage |
| Existing Vitest suite | Five synthetic tests recorded as passing in v1.1 audit | NOT_RUN again in v1.1.1 | DOCUMENTED prior audit only | Not relabeled as a fresh run or independently reproducible public bootstrap |
| New numerical reference | Three public synthetic fixtures compared to SciPy logrank; tolerance 2e-7 absolute | See [reference report](../portfolio-audit/NUMERICAL_REFERENCE.md) and [execution record](../portfolio-audit/evidence/runtime-execution.json) | INDEPENDENTLY_VERIFIED only for those numerical comparisons if execution PASS | Separate implementation, not independent human review; not real cohorts or all statistical cases |
| Statistical-method correctness in general | Source and bounded synthetic checks | NOT_ESTABLISHED outside checked scope | DOCUMENTED implementation | No broad audit of assumptions, confounding, multiplicity, units or ingestion |
| Historical ten-gene SciPy comparison | Original public README reports SciPy 1.17.1 and agreement below 2e-7 for seven displayed p-values; three withheld | NOT_RUN: original cohort inputs, dated run and raw outputs unavailable | HISTORICAL_REPORTED; REQUIRES_REVIEW | New synthetic checks do not reproduce or upgrade this claim |
| Researcher roles | Direct researcher confirmation of direction and evaluation | Not an empirical validation test | RESEARCHER_CONFIRMED | Specific historical decisions and collaborators remain unresolved |
| Integration testing | No full bootstrap, operational data or services in source selection | NOT_RUN | NOT_ESTABLISHED | Pure-module checks are insufficient |
| Biological validation | No new experimental evidence supplied | NOT_RUN | NOT_ESTABLISHED | No new biological discovery or causal claim |
| External independent validation | No external evaluation supplied | NOT_RUN | NOT_ESTABLISHED | AI-assisted remediation is not independent peer review |
| Clinical validation or suitability | Research-only use; clinical decisions excluded | NOT_RUN | NOT_ESTABLISHED | No diagnostic, prognostic, treatment or regulatory claim |

The historical comparison remains quoted in the original README body to preserve the baseline record, preceded by **HISTORICAL_REPORTED**. Its seven displayed comparisons, tolerance and three withheld genes are historical claims, not new measurements. Do not reuse the new synthetic outputs as evidence for those genes.
