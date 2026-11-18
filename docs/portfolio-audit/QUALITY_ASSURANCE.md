# v1.1.1 quality assurance execution record

Audit date: **2026-11-18**. These bounded software checks do not establish independent biological, external or clinical validation. Researcher authorization covers publication of the reviewed portfolio; it does not create a software release, broader source/data license or production deployment.

## Recorded isolated runtime execution

The [machine-readable execution record](evidence/runtime-execution.json) contains exact UTC start/end times, commands, exits, stdout and stderr. Only temporary directory paths are replaced with `<isolated-review-root>`. Every recorded runtime command exited **0** with empty stderr.

Executed in a fresh temporary filesystem copy without `.git` or `node_modules`, with only PATH, temporary HOME, LANG, TZ and NO_COLOR passed to child processes. No production secrets, application server, database or network request was used by those tests. This is filesystem/process-environment isolation, not an OS-level network sandbox, VM or independently provisioned toolchain. Existing SciPy/NumPy packages were reused; nothing was installed.

| Command from repository root | Exact versions/dependencies | Exit | Outcome | stdout summary |
|---|---|---|---|---|
| `node --version` | Node.js v24.22.3 | 0 | PASS | v24.22.3 |
| `python3 --version` | Python 3.11.14 | 0 | PASS | Python 3.11.14 |
| `node examples/synthetic-survival-demo.mjs` | Node v24.22.3; native TS stripping; built-ins only | 0 | PASS | Synthetic assertions passed; no biological/clinical validation |
| `node --test artifacts/ibios-tools/src/pages/ibios-tools/ibce/km-analysis.test.mjs` | Node v24.22.3; no npm dependency | 0 | PASS | 3 tests, 1 suite, 3 pass, 0 fail |
| `python3 examples/verify-numerical-reference.py` | Python 3.11.14, SciPy 1.17.1, NumPy 2.4.6, Node v24.22.3 | 0 | PASS | 3 synthetic fixtures within absolute tolerance 2e-7 |

These recorded isolated runs executed at 06:46:33-06:46:36 UTC on 2026-11-18. They are not GitHub Actions results. The [reference report](NUMERICAL_REFERENCE.md) supplies exact numeric outputs and scope. The publication process also reruns applicable commands against the exact selected publication tree.

## Structural and publication checks

| Check | Outcome and scope |
|---|---|
| Relative Markdown/HTML image paths, anchors and fenced blocks | Offline `python3 scripts/validate-portfolio.py` |
| Source integrity | All 30 files checked against [SOURCE_MANIFEST.sha256](../../SOURCE_MANIFEST.sha256); no scientific source or original test changed |
| License, notices, source manifest and ignore rules | Baseline Git blob IDs checked by the validator |
| Original scientific README body | Preserved verbatim after the explicit HISTORICAL_REPORTED preface |
| CFF 1.2.0 schema | PASS during review with official schema, YAML 2.9.1 and Ajv 8.18.0; no invented release version/date, DOI, ORCID or coauthor |
| Workflow restrictions | Reviewed: manual workflow_dispatch only, contents: read, pinned action commits, no persisted checkout credentials, Node major 24, no secrets/deployments |
| Focused publication disclosure check | Exact intended files checked for bounded credential/private-endpoint/restricted-content patterns and distribution scope; not exhaustive security or legal certification |
| Screenshot provenance/metadata | Actual captures and hashes in [asset provenance](../portfolio/assets/README.md); no private account or participant record visible |
| Screenshot redistribution | Researcher approved original and requested English companion; private approval transcript excluded |
| Publication boundary | Internal review reports, private conversations/history, review ZIP, operational configuration and excluded data/source are not public payload |

The English [capture record](evidence/english-capture.json) identifies the running workspace preview, not a published-deployment capture. Some shared navigation remains Indonesian; displayed aggregate status is observed UI, not independent data verification. Original image loading-state limitations remain explicit.

## Unperformed or unestablished checks

| Check | Outcome | Limit |
|---|---|---|
| Historical ten-gene SciPy reconstruction | NOT_RUN | Original exact inputs, dated execution and raw outputs absent; HISTORICAL_REPORTED only |
| Fresh five-test Vitest run for v1.1.1 | NOT_RUN | Earlier v1.1 audit recorded 5 passing tests with host Vitest 4.1.11; not a standalone bootstrap |
| Mermaid grammar/render parser | NOT_RUN | Tool unavailable during review; no new validation claim |
| GitHub Actions | NOT_RUN in this local record | Prepared workflow is manual-only; consult actual GitHub checks/runs for current status |
| Full application/build/integration/browser regression | NOT_RUN | Application unchanged; selected source excludes operational infrastructure |
| Exhaustive secret/dependency/SAST/dataflow/penetration audits | NOT_RUN | Focused disclosure check is not comprehensive security certification |
| Biological, external or clinical validation | NOT_ESTABLISHED | No supporting study performed or supplied |

`PASS` means the specified executed check succeeded, `FAIL` means it executed and failed, `NOT_RUN` means it did not execute, and `NOT_ESTABLISHED` means supporting evidence is absent. Researcher confirmation and separate-reference numerical comparisons are not independent human peer review.
