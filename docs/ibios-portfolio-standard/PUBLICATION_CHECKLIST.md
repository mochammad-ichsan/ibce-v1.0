# Publication checklist

- [ ] Baseline repository, branch, working tree and approved file boundary recorded.
- [ ] Public and operational repositories treated as separate inventories.
- [ ] Scientific claims map to authentic evidence; objectives are not findings.
- [ ] Contributions, authorship, manuscript status and AI disclosure reviewed.
- [ ] Data, third-party assets and intellectual-property rights confirmed.
- [ ] Existing licenses and notices preserved; no false open-source label.
- [ ] Exact candidate and relevant history reviewed for secrets and restricted content.
- [ ] No private infrastructure, sensitive data or unpublished material included.
- [ ] Relative links, examples and metadata checked; unrun checks labeled.
- [ ] Synthetic examples contain no real participants or implied discoveries.
- [ ] Public settings and automation approved separately.
- [ ] Researcher reviewed exact diff and approved publication scope.
- [ ] No push, merge, release, license change or deployment before authorization.

Classify each proposed item as APPROVED_FOR_REVIEW, REQUIRES_RESEARCHER_APPROVAL or BLOCKED. These are review-routing states, not automated final publication approval.

## Mandatory remediation gates

- [ ] Researcher-led/AI-assisted roles confirmed where asserted; specific historical decisions and collaborators kept uncertain where unsupported.
- [ ] Provenance statuses and execution outcomes recorded separately.
- [ ] Independent numerical claims include reference code, fixtures, exact outputs, tolerances and dependency versions.
- [ ] Historical reports lacking reproducible inputs remain HISTORICAL_REPORTED / NOT_RUN.
- [ ] Runtime commands executed with recorded versions, exits, date, stdout/stderr and isolation boundary; missing tools NOT_RUN.
- [ ] Every image has actual capture/source provenance, descriptive alt text, loading-state caveats, metadata/content inspection and redistribution clearance.
- [ ] Unknown asset rights/IP are publication blockers, even if the source page is public.
- [ ] Citation author/name fields reviewed; no invented release version/date, DOI, ORCID, institution or coauthor.
- [ ] CI uses a compatible runtime, pinned actions and least privilege; no secrets/deployment; activation requires approval.
- [ ] Exact reviewed diff/package explicitly approved for the specific public action; review-ready is not authorization.

Final verdict vocabulary: READY_FOR_RESEARCHER_REVIEW, REQUIRES_REMEDIATION, BLOCKED_BY_SECURITY_OR_IP or BLOCKED_BY_MISSING_ACCESS. Record blockers even when a local package is ready to inspect. Unresolved rights must be cleared or the asset removed before publication.
