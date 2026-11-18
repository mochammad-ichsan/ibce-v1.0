# Researcher-Led, AI-Assisted Scientific Software Development

Researcher and portfolio owner: **Mochammad Ichsan**. On 2026-11-18 the researcher confirmed personally directing the scientific objectives, dataset selection, methodological requirements, feature design and evaluation of results. AI/Replit primarily translated requirements into code, and sometimes suggested scientific, methodological and technical approaches that the researcher evaluated. This confirmation supports attribution; it is not independent reconstruction of historical decisions.

## Evidence-status definitions

- **RESEARCHER_CONFIRMED:** directly affirmed by the researcher. Not independently corroborated merely by repeating the statement.
- **DOCUMENTED:** an inspectable artifact supports the stated activity or implementation; it does not necessarily identify its historical author.
- **INDEPENDENTLY_VERIFIED:** a precisely bounded check against a separate reference or evidence source was executed. This is not independent human peer review or proof of authorship.
- **REQUIRES_REVIEW:** the role, specific decision, collaborator, rights or evidence is unresolved.

These describe provenance. Test outcomes `PASS`, `FAIL`, `NOT_RUN` and scientific evidence `NOT_ESTABLISHED` are recorded separately.

## Specific contribution matrix

| Activity | Researcher contribution | AI/Replit contribution | Evidence and status | Remaining limit |
|---|---|---|---|---|
| Conceptualization | Directed scientific objectives | Sometimes suggested scientific approaches for researcher evaluation | RESEARCHER_CONFIRMED: direct confirmation above; DOCUMENTED: [project scope](PROJECT_OVERVIEW.md) | Origin and chronology of individual ideas and collaborators REQUIRES_REVIEW |
| Research questions | Directed objectives that guide questions | Assisted discussion and expression of possible approaches | RESEARCHER_CONFIRMED for direction; DOCUMENTED: [questions in README](../../README.md#scientific-motivation-and-questions) | Do not assign sole historical authorship to every question |
| Dataset selection | Personally directed dataset selection | Could suggest approaches subject to researcher evaluation; no dataset-specific suggestion is asserted | RESEARCHER_CONFIRMED; DOCUMENTED: [source-use notices](../../SOURCE_ATTRIBUTION.md) | Who proposed each resource and its historical rationale REQUIRES_REVIEW |
| Methodological choices | Directed methodological requirements and evaluated AI suggestions | Sometimes suggested methodological approaches and implemented requirements | RESEARCHER_CONFIRMED; DOCUMENTED: [median, eligibility and log-rank implementation](../../artifacts/api-server/src/ibce/survival-analysis.ts) | Inspected implementation does not prove who selected each cutpoint or rule |
| Feature specification | Personally directed feature design | Primarily translated requirements into software; sometimes proposed technical approaches | RESEARCHER_CONFIRMED; DOCUMENTED: [source navigation](../../README.md#selected-research-source) | Feature-by-feature provenance and manual code fractions are not reconstructed |
| AI-assisted implementation | Supplied requirements and evaluated proposed approaches; no claim of manually writing all code | Primarily implemented requirements in code | RESEARCHER_CONFIRMED; DOCUMENTED: existing acknowledgements in [integrity record](../../artifacts/ibios-tools/src/pages/ibios-tools/ibce/integrity-data.ts) | No line-level authorship, exclusive manual authorship or quantitative AI share asserted |
| Interpretation and evaluation | Personally directed evaluation of results | Assisted implementation; runtime generated explanations are a separate feature | RESEARCHER_CONFIRMED; DOCUMENTED: [AI disclosure](AI_ASSISTED_DEVELOPMENT.md) | This is not confirmation that every historical output received expert review or is biologically valid |
| Testing | Historical test authorship not specified by this confirmation | This remediation used AI assistance to prepare and execute bounded checks | DOCUMENTED: existing public tests and [execution record](../portfolio-audit/QUALITY_ASSURANCE.md); INDEPENDENTLY_VERIFIED only for new synthetic calculations against SciPy | Historical tests, independent human review and ten-gene reference reconstruction REQUIRES_REVIEW |
| Dissemination | Identified as researcher and portfolio owner | Assisted preparation of documentation and proposed review package | RESEARCHER_CONFIRMED for identity; DOCUMENTED: existing public repository and local candidate | Complete authorship, collaborator credits and publication authorization REQUIRES_REVIEW |

No row claims that all scientific ideas, methodological decisions or code were manually produced by the researcher. Source-linked examples establish implemented content, not specific historical authorship. The broad confirmation does not assign individual decisions to AI either.

## Authorship and citation gate

Review collaborators, complete authorship, the structured name representation and acknowledgements before publication. Existing [third-party notices](../../SOURCE_ATTRIBUTION.md) and [CITATION.cff](../../CITATION.cff) remain linked. No institution, academic title, personal email, ORCID, DOI, paper or coauthor is invented. Researcher evaluation is distinct from independent statistical, biological or clinical validation.
