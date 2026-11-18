# Scientific evidence matrix template

| Claim/category | Evidence locator | Scope | Verified execution date | Result | Status | Limits/reviewer |
|---|---|---|---|---|---|---|
| Software functionality | [file/test/report] | [exact flow] | [date or not established] | [observed result] | REQUIRES_REVIEW | [limits] |
| Unit/integration tests | [execution record] | [included/excluded cases] | [date] | [counts] | REQUIRES_REVIEW | [limits] |
| Numerical/statistical verification | [reference calculation] | [inputs/tolerance/assumptions] | [date] | [comparison] | REQUIRES_REVIEW | [independence] |
| Domain/biological validation | [experiment/evaluation] | [population/task] | [date] | [actual result] | NOT_ESTABLISHED | [gaps] |
| External independent validation | [independent report] | [scope] | [date] | [actual result] | NOT_ESTABLISHED | [conflicts/limits] |
| Clinical or other high-stakes validation | [governed study] | [use/population] | [date] | [actual result] | NOT_ESTABLISHED | [limits] |

Allowed statuses: VERIFIED, PARTIALLY_VERIFIED, NOT_ESTABLISHED, NOT_APPLICABLE, REQUIRES_REVIEW. Record execution state `NOT_RUN` separately when no check ran.

For new records, use separate fields for provenance (`RESEARCHER_CONFIRMED`, `DOCUMENTED`, `INDEPENDENTLY_VERIFIED`, `REQUIRES_REVIEW`) and outcome (`PASS`, `FAIL`, `NOT_RUN`, `NOT_ESTABLISHED`). Do not treat legacy `VERIFIED` as independent review without identifying the check.

## Independent numerical reference

Record reference implementation/code, synthetic or rights-cleared input fixtures, exact outputs, mathematical assumptions, absolute/relative tolerances and why those tolerances are appropriate. Report runtime and dependency versions, commands, dates, exits and stdout/stderr. Keep synthetic checks separate from real-cohort claims. Preserve unrepeatable earlier claims as **HISTORICAL_REPORTED**; missing historical inputs/outputs imply NOT_RUN, not PASS. An independent computation is not an independent researcher or biological validation.

## Runtime reproducibility

List the minimum runtime and the exact version actually executed, dependency versions and installation needs, isolation method, working directory, deterministic inputs/seeds and excluded services. A compatible CI major version is not a patch-locked environment. Mark missing tools NOT_RUN and do not silently install operational dependencies or imply a reproducible full application.

Source code demonstrates implemented logic, not an observed real-world result. Existing documentation is a claim source, not independent verification. `NOT_APPLICABLE` requires a rationale; it must not hide missing validation for a claimed use.
