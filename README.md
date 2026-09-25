# IBCE source review candidate

**Status: source-only research code. Not a runnable application or clinical tool.**

This is a selected, source-only snapshot of the IBCE components in the HRC workspace. It is **not a complete application, a database, a reproducible research package, or a runnable deployment**. The original UI depends on shared HRC components and generated clients. The API source refers to operational modules and shared services intentionally absent here; it cannot be compiled or run in isolation. This snapshot is provided for code and method review only, not clinical decisions.

The source paths under `artifacts/` and `lib/` preserve their original workspace locations. No dependency installation or execution instructions are supplied because that would imply a supported standalone application. Check `SOURCE_MANIFEST.sha256` against the actual files to detect changes after review. Original IBCE code in this selection is offered under the [PolyForm Noncommercial License 1.0.0](LICENSE.md); this is a source-available noncommercial license, not an unrestricted open-source license. See `SOURCE_ATTRIBUTION.md` for separate external source-use notices. No biological datasets are included or licensed by this code license.

## Included

- IBCE-specific user-facing pages, panels, navigation, translations, tooltips, and styles from IBIOS Tools, excluding its administrative page.
- Selected IBCE API source for dossier queries, interpretation, annotation, localization, references, and survival analysis, plus synthetic survival and chart tests.
- IBCE database schema definitions, **not** database rows or exports.

## Intentionally excluded

- The rest of the HRC monorepo, shared application bootstraps, packages, credentials, configuration, production environment files, dependencies, and generated bundles.
- Raw or curated biological data, Cellosaurus snapshot records, attached assets, patient/sample-level exports, backups, database dumps, ingestion scripts and operational ingestion/export modules.
- Administrative source and account identities, unpublished manuscripts, figures, internal notes, and other research outputs.
- Permission for commercial use, or any license to third-party datasets and research material.

Some included UI refers to download/admin capabilities, and the included API router imports modules that are excluded above. These references document how the original system is organized; they are not an offer of working endpoints or included data.

## Scientific scope and remaining review

The included survival implementation restricts RNA observations to TCGA sample type 01, handles duplicate and invalid observations explicitly, and uses an exploratory median split, Kaplan-Meier estimates, and an unadjusted log-rank comparison. Sparse-event results are withheld. These are cohort-level analyses, not individual prognoses or causal estimates. Passing synthetic unit tests does **not** establish independent statistical validation of all live cohorts or correction for confounding and multiple testing.

A read-only comparison used SciPy 1.17.1 `scipy.stats.logrank` with `CensoredData` for ten live gene cohorts. All seven displayed API p-values differed from the reference by less than 0.0000002; ERBB2, PTEN, and EGFR withheld their p-values under the sparse-event rule. Synthetic tests also cover invalid observations, median split, exclusions, and chart endpoints. This limited cross-check does not validate every gene, the underlying data, or the analysis design.

Before using this source in research or extending its scope, a reviewer should confirm:

1. Independent validation of any new cohort and of the input data, beyond the ten-gene reference comparison and synthetic tests here.
2. Source attribution and terms for HPA, TCGA/GDC, Cellosaurus, external annotation APIs, and any AI service if corresponding data or services are used.
3. Scientific wording and citations for any claims made using the code. Correcting for confounders and multiple testing is outside the provided analysis.
4. A new file-by-file review and credential/identifier scan of **any additional files** before uploading them. No data export or copied private content may be added without repeating that review.

Do not infer that this source-only publication endorses an analysis result or supports clinical use.