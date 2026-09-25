import { Router } from "express";
import { db } from "@workspace/db";
import {
  ibceIhcBrca,
  ibcePrognosisBrca,
  ibceCelllineMeta,
  ibceCelllineRna,
  ibcePatientRna,
  ibceClinicalBrca,
  ibceIngestLog,
} from "@workspace/db";
import { ilike, or, eq, sql, desc, inArray } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { annotateGene, searchMygene } from "./mygene.js";
import { localizeMyGeneAnnotation, type IbceLocale } from "./localize.js";
import { IBCE_REFERENCES, formatReference } from "./references.js";
import { ingestDataset, type DatasetKey } from "./ingest.js";
import { logger } from "../lib/logger.js";
import downloadRouter from "./download.js";
import interpretationRouter from "./interpretation.js";
import { cellosaurusSnapshot } from "./cellosaurus-snapshot.js";
import adminRouter from "./admin.js";
import { analyzeSurvival, selectPrimaryTumorExpression } from "./survival-analysis.js";

const router = Router();
router.use("/download", downloadRouter);
router.use("/interpretation", interpretationRouter);
router.use("/admin", adminRouter);
const localizationRequests = new Map<string, number[]>();
const LOCALIZATION_WINDOW_MS = 60_000;
const LOCALIZATION_REQUEST_LIMIT = 30;

function allowLocalizationRequest(ip: string): boolean {
  const now = Date.now();
  const recent = (localizationRequests.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < LOCALIZATION_WINDOW_MS,
  );
  if (recent.length >= LOCALIZATION_REQUEST_LIMIT) {
    localizationRequests.set(ip, recent);
    return false;
  }
  recent.push(now);
  localizationRequests.set(ip, recent);
  if (localizationRequests.size > 5_000) {
    for (const [key, timestamps] of localizationRequests) {
      if (!timestamps.some((timestamp) => now - timestamp < LOCALIZATION_WINDOW_MS)) {
        localizationRequests.delete(key);
      }
    }
  }
  return true;
}

function sameNumber(values: Array<number | null | undefined>): { value: number | null; status: "consistent" | "unavailable" | "discordant" } {
  const present = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!present.length) return { value: null, status: "unavailable" };
  if (values.some((v) => v == null)) return { value: null, status: "unavailable" };
  const first = present[0];
  return present.every((v) => v === first)
    ? { value: first, status: "consistent" }
    : { value: null, status: "discordant" };
}

const HPA_CELL_LINES_URL = "https://www.proteinatlas.org/download?file=rna_cell_lines.tsv.zip";
const cellosaurusUrl = (id: string | null) => id ? `https://www.cellosaurus.org/${encodeURIComponent(id)}` : null;
type CellosaurusSnapshotRecord = (typeof cellosaurusSnapshot.records)[number];
const cellosaurusById = new Map<string, CellosaurusSnapshotRecord>(
  cellosaurusSnapshot.records.map((record) => [record.cellosaurusId, record]),
);
const cellosaurusByName = new Map<string, CellosaurusSnapshotRecord>(
  cellosaurusSnapshot.records.map((record) => [record.cellLine.toLowerCase(), record]),
);

router.get("/cell-lines", async (_req, res) => {
  try {
    const rows = await db.select().from(ibceCelllineMeta).orderBy(ibceCelllineMeta.cellLine);
    const cellLines = rows.map((row) => {
      // Never replace a mismatched CVCL identifier with a name-based match.
      const cellosaurus = row.cellosaurusId
        ? cellosaurusById.get(row.cellosaurusId)
        : cellosaurusByName.get(row.cellLine.toLowerCase());
      return {
        cellLine: row.cellLine,
        cellosaurusId: row.cellosaurusId,
        sex: cellosaurus?.sex ?? null,
        ageYears: cellosaurus?.donorAgeYears ?? null,
        ageRaw: cellosaurus?.donorAgeRaw ?? null,
        derivedSiteRaw: cellosaurus?.derivedSiteRaw ?? null,
        diseaseClassificationRaw: cellosaurus?.diseaseClassificationRaw ?? null,
        origin: row.primaryMetastasis,
        site: row.sampleCollectionSite,
        diseaseSubtype: row.diseaseSubtype,
        molecularSubtype: null,
        sourceUrl: cellosaurus?.sourceUrl ?? cellosaurusUrl(row.cellosaurusId),
        hpaSourceUrl: HPA_CELL_LINES_URL,
        cellosaurusProvenance: {
          release: cellosaurusSnapshot.snapshotVersion,
          retrievedAt: cellosaurusSnapshot.retrievedAt,
          sourceUrl: cellosaurusSnapshot.sourceUrl,
          recordVersion: cellosaurus?.cellosaurusVersion ?? null,
          recordUpdatedRaw: cellosaurus?.recordUpdatedRaw ?? null,
        },
        cancerCellLine: row.cancerCellLine,
        primaryDisease: row.primaryDisease,
        primaryMetastasis: row.primaryMetastasis,
        sampleCollectionSite: row.sampleCollectionSite,
      };
    });
    res.json({ total: cellLines.length, cellLines });
  } catch (err) {
    logger.error({ err }, "IBCE cell-line metadata error");
    res.status(500).json({ error: "Failed to fetch cell-line metadata" });
  }
});

// Resolve the workspace-root attached_assets dir regardless of CWD.
// In dev, pnpm sets CWD to the package dir (artifacts/api-server/), so go up two levels.
// In production, Replit runs the server from the workspace root, so attached_assets is a direct child.
function resolveAssetsDir(): string {
  const candidates = [
    path.join(process.cwd(), "attached_assets"),               // production (CWD = workspace root)
    path.join(process.cwd(), "..", "..", "attached_assets"),   // dev (CWD = artifacts/api-server/)
    path.join(process.cwd(), "..", "attached_assets"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[1];
}
const ASSETS_DIR = resolveAssetsDir();

function findAsset(prefix: string, ext = ".zip"): string | null {
  if (!fs.existsSync(ASSETS_DIR)) return null;
  try {
    const f = fs.readdirSync(ASSETS_DIR).find((n) => n.startsWith(prefix) && n.endsWith(ext));
    return f ? path.join(ASSETS_DIR, f) : null;
  } catch { return null; }
}

function assetExists(prefix: string, ext = ".zip"): boolean {
  return findAsset(prefix, ext) !== null;
}

// ── GET /ibce/status ────────────────────────────────────────────────────────

router.get("/status", async (_req, res) => {
  try {
    const [ihcCount, progCount, metaCount, rnaCount, patRnaCount, clinCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(ibceIhcBrca),
      db.select({ count: sql<number>`count(*)::int` }).from(ibcePrognosisBrca),
      db.select({ count: sql<number>`count(*)::int` }).from(ibceCelllineMeta),
      db.select({ count: sql<number>`count(*)::int` }).from(ibceCelllineRna),
      db.select({ count: sql<number>`count(*)::int` }).from(ibcePatientRna),
      db.select({ count: sql<number>`count(*)::int` }).from(ibceClinicalBrca),
    ]);

    const lastIngestRows = await db
      .select({ ingestedAt: ibceIngestLog.ingestedAt })
      .from(ibceIngestLog)
      .where(eq(ibceIngestLog.ok, true))
      .orderBy(desc(ibceIngestLog.ingestedAt))
      .limit(1);

    const ihcC = ihcCount[0]?.count ?? 0;
    const progC = progCount[0]?.count ?? 0;
    const metaC = metaCount[0]?.count ?? 0;
    const rnaC = rnaCount[0]?.count ?? 0;
    const patRnaC = patRnaCount[0]?.count ?? 0;
    const clinC = clinCount[0]?.count ?? 0;

    const geneCount = ihcC > 0 ? ihcC : progC;

    const datasets = [
      {
        key: "ihc",
        label: "IHC Protein Expression",
        source: "Human Protein Atlas - Pathology Atlas",
        rowCount: ihcC || null,
        isAvailable: assetExists("cancer_data.tsv_"),
        isIngested: ihcC > 0,
        ingestedAt: null,
        fileSizeBytes: null,
      },
      {
        key: "prognosis",
        label: "Prognostic Association",
        source: "Human Protein Atlas - Pathology Atlas",
        rowCount: progC || null,
        isAvailable: assetExists("cancer_prognostic_data.tsv_"),
        isIngested: progC > 0,
        ingestedAt: null,
        fileSizeBytes: null,
      },
      {
        key: "cellline_meta",
        label: "Breast Cancer Cell Lines",
        source: "Human Protein Atlas - Cell Line Atlas",
        rowCount: metaC || null,
        isAvailable: assetExists("rna_cell_lines.tsv_"),
        isIngested: metaC > 0,
        ingestedAt: null,
        fileSizeBytes: null,
      },
      {
        key: "cellline_rna",
        label: "Cell Line RNA Expression",
        source: "Human Protein Atlas - RNA Consensus Dataset",
        rowCount: rnaC || null,
        isAvailable: assetExists("rna_celline.tsv_"),
        isIngested: rnaC > 0,
        ingestedAt: null,
        fileSizeBytes: null,
      },
      {
        key: "patient_rna",
        label: "Patient RNA Expression (Cancer Samples)",
        source: "Human Protein Atlas - rna_cancer_sample",
        rowCount: patRnaC || null,
        isAvailable: true,
        isIngested: patRnaC > 0,
        ingestedAt: null,
        fileSizeBytes: null,
      },
      {
        key: "clinical",
        label: "TCGA-BRCA Clinical Data",
        source: "The Cancer Genome Atlas (TCGA)",
        rowCount: clinC || null,
        isAvailable: assetExists("clinical.project-tcga-brca", ".gz"),
        isIngested: clinC > 0,
        ingestedAt: null,
        fileSizeBytes: null,
      },
    ];

    res.json({
      datasets,
      geneCount,
      lastIngestedAt: lastIngestRows[0]?.ingestedAt?.toISOString() ?? null,
    });
  } catch (err) {
    logger.error({ err }, "IBCE status error");
    res.status(500).json({ error: "Failed to get status" });
  }
});

// ── GET /ibce/search?q= ──────────────────────────────────────────────────────

router.get("/search", async (req, res) => {
  const q = String(req.query["q"] ?? "").trim();
  const limit = Math.min(parseInt(String(req.query["limit"] ?? "15"), 10) || 15, 30);

  if (q.length < 2) {
    res.json([]);
    return;
  }

  try {
    // Search local HPA data first
    const pattern = `${q}%`;
    const [ihcHits, progHits] = await Promise.all([
      db
        .select({ ensemblId: ibceIhcBrca.ensemblId, geneName: ibceIhcBrca.geneName })
        .from(ibceIhcBrca)
        .where(or(ilike(ibceIhcBrca.geneName, pattern), ilike(ibceIhcBrca.ensemblId, pattern)))
        .limit(limit),
      db
        .select({ ensemblId: ibcePrognosisBrca.ensemblId, geneName: ibcePrognosisBrca.geneName })
        .from(ibcePrognosisBrca)
        .where(or(ilike(ibcePrognosisBrca.geneName, pattern), ilike(ibcePrognosisBrca.ensemblId, pattern)))
        .limit(limit),
    ]);

    // Merge local hits
    const seen = new Map<string, { ensemblId: string; symbol: string; hasIhc: boolean; hasPrognosis: boolean }>();
    for (const h of ihcHits) {
      if (!h.ensemblId) continue;
      seen.set(h.ensemblId, { ensemblId: h.ensemblId, symbol: h.geneName, hasIhc: true, hasPrognosis: false });
    }
    for (const h of progHits) {
      if (!h.ensemblId) continue;
      const existing = seen.get(h.ensemblId);
      if (existing) existing.hasPrognosis = true;
      else seen.set(h.ensemblId, { ensemblId: h.ensemblId, symbol: h.geneName, hasIhc: false, hasPrognosis: true });
    }

    // Get cell line info for merged set
    const localEnsemblIds = [...seen.keys()].slice(0, limit);
    let rnaHitSet = new Set<string>();
    if (localEnsemblIds.length > 0) {
      const rnaHits = await db
        .selectDistinct({ ensemblId: ibceCelllineRna.ensemblId })
        .from(ibceCelllineRna)
        .where(
          sql`${ibceCelllineRna.ensemblId} = ANY(${sql.raw(`ARRAY[${localEnsemblIds.map((id) => `'${id}'`).join(",")}]`)})`,
        )
        .limit(localEnsemblIds.length);
      rnaHitSet = new Set(rnaHits.map((r) => r.ensemblId));
    }

    const localResults = [...seen.values()].slice(0, limit).map((h) => ({
      ensemblId: h.ensemblId,
      symbol: h.symbol,
      name: h.symbol,
      chromosome: null as string | null,
      hasIhc: h.hasIhc,
      hasPrognosis: h.hasPrognosis,
      hasCellLine: rnaHitSet.has(h.ensemblId),
    }));

    // Always enrich local HPA hits with MyGene.info metadata. HPA source tables
    // provide gene and Ensembl identifiers but do not include chromosome fields.
    const mygeneHits = await searchMygene(q, Math.max(limit + 5, 15));
    const mygeneByEnsembl = new Map(mygeneHits.map((hit) => [hit.ensemblId, hit]));
    const localEnsemblSet = new Set(localResults.map((result) => result.ensemblId));

    for (const result of localResults) {
      const mygeneHit = mygeneByEnsembl.get(result.ensemblId);
      if (!mygeneHit) continue;
      result.name = mygeneHit.name;
      result.chromosome = mygeneHit.chromosome;
    }

    // Supplement sparse local result sets with additional MyGene.info matches.
    if (localResults.length < limit) {
      for (const mg of mygeneHits) {
        if (localEnsemblSet.has(mg.ensemblId) || localResults.length >= limit) continue;
        localResults.push({
          ensemblId: mg.ensemblId,
          symbol: mg.symbol,
          name: mg.name,
          chromosome: mg.chromosome,
          hasIhc: false,
          hasPrognosis: false,
          hasCellLine: false,
        });
        localEnsemblSet.add(mg.ensemblId);
      }
    }

    res.json(localResults.slice(0, limit));
  } catch (err) {
    logger.error({ err }, "IBCE search error");
    res.status(500).json({ error: "Search failed" });
  }
});

// ── GET /ibce/gene/:geneId ───────────────────────────────────────────────────

router.get("/gene/:geneId", async (req, res) => {
  const geneId = req.params["geneId"]?.trim();
  const locale: IbceLocale = req.query["locale"] === "id" ? "id" : "en";
  if (!geneId) {
    res.status(400).json({ error: "geneId is required" });
    return;
  }
  if (locale === "id" && !allowLocalizationRequest(req.ip ?? "unknown")) {
    res.status(429).json({ error: "Too many localization requests. Please try again shortly." });
    return;
  }

  const isEnsg = geneId.toUpperCase().startsWith("ENSG");

  try {
    // Query local tables
    // Patient RNA stores gene_name = ensembl_id (no symbol in HPA file),
    // so always query it by ensembl_id. We first resolve the ensembl_id from
    // the other tables (which do carry gene symbols), then do a second query.
    const [ihcRows, progRows, rnaRows] = await Promise.all([
      isEnsg
        ? db.select().from(ibceIhcBrca).where(eq(ibceIhcBrca.ensemblId, geneId))
        : db.select().from(ibceIhcBrca).where(sql`lower(${ibceIhcBrca.geneName}) = ${geneId.toLowerCase()}`),
      isEnsg
        ? db.select().from(ibcePrognosisBrca).where(eq(ibcePrognosisBrca.ensemblId, geneId))
        : db.select().from(ibcePrognosisBrca).where(sql`lower(${ibcePrognosisBrca.geneName}) = ${geneId.toLowerCase()}`),
      isEnsg
        ? db.select().from(ibceCelllineRna).where(eq(ibceCelllineRna.ensemblId, geneId))
        : db.select().from(ibceCelllineRna).where(sql`lower(${ibceCelllineRna.geneName}) = ${geneId.toLowerCase()}`),
    ]);

    // If nothing found locally, try MyGene.info to verify the gene exists
    const localEnsemblId = ihcRows[0]?.ensemblId ?? progRows[0]?.ensemblId ?? rnaRows[0]?.ensemblId ?? null;
    const localSymbol = ihcRows[0]?.geneName ?? progRows[0]?.geneName ?? rnaRows[0]?.geneName ?? null;

    // Fetch annotation from MyGene.info
    const sourceAnnotation = await annotateGene(geneId);
    const annotation = sourceAnnotation
      ? await localizeMyGeneAnnotation(sourceAnnotation, locale)
      : null;

    if (!annotation && ihcRows.length === 0 && progRows.length === 0 && rnaRows.length === 0) {
      res.status(404).json({ error: `Gene '${geneId}' not found` });
      return;
    }

    // Get cell line metadata for the RNA hits
    const cellLineNames = [...new Set(rnaRows.map((r) => r.cellLine))];
    const metaMap = new Map<string, typeof ibceCelllineMeta.$inferSelect>();
    if (cellLineNames.length > 0) {
      const metaRows = await db
        .select()
        .from(ibceCelllineMeta)
        .where(sql`${ibceCelllineMeta.cellLine} = ANY(${sql.raw(`ARRAY[${cellLineNames.map((n) => `'${n.replace(/'/g, "''")}'`).join(",")}]`)})`)
        .limit(200);
      for (const m of metaRows) metaMap.set(m.cellLine, m);
    }

    const ensemblId = annotation?.ensemblId ?? localEnsemblId ?? (isEnsg ? geneId : null);
    const symbol = annotation?.symbol ?? localSymbol ?? geneId;
    const name = annotation?.name ?? symbol;

    // Patient RNA is always stored by ensembl_id (HPA file has no gene symbol column)
    const patRnaRows = ensemblId
      ? await db.select().from(ibcePatientRna).where(eq(ibcePatientRna.ensemblId, ensemblId)).limit(200)
      : [];

    // Use all patient-RNA samples for this gene, not the 200-row dossier display
    // limit. A clinical record is gene-linked only when its TCGA case barcode
    // matches a sample belonging to the resolved Ensembl identifier.
    const matchedClinicalRows = ensemblId
      ? await db.select({
          caseBarcode: ibceClinicalBrca.caseBarcode,
        }).from(ibceClinicalBrca).where(inArray(
          ibceClinicalBrca.caseBarcode,
          db.selectDistinct({
            caseBarcode: sql<string>`left(${ibcePatientRna.sample}, 12)`,
          }).from(ibcePatientRna).where(sql`
            ${ibcePatientRna.ensemblId} = ${ensemblId}
            AND ${ibcePatientRna.sample} LIKE 'TCGA-%'
          `),
        ))
      : [];
    const clinicalContext = {
      available: matchedClinicalRows.length > 0,
      nPatients: matchedClinicalRows.length,
    };

    const ihcFormatted = ihcRows.map((r) => ({
      cancer: r.cancer,
      high: r.high,
      medium: r.medium,
      low: r.low,
      notDetected: r.notDetected,
      total: r.high + r.medium + r.low + r.notDetected,
    }));

    const progFormatted = progRows.map((r) => ({
      cancer: r.cancer,
      classification: r.classification,
      pValue: r.pValue ?? null,
      hazardRatio: null,
      nPatients: null,
      cutoff: null,
    }));

    // The production HPA import historically contained an identical second
    // copy of many gene×cell-line rows. Collapse only identical observations;
    // never pick one value when duplicate source rows disagree.
    const rnaForGene = annotation?.ensemblId
      ? rnaRows.filter((r) => r.ensemblId === annotation.ensemblId)
      : rnaRows;
    const cellLineGroups = new Map<string, typeof rnaForGene>();
    for (const row of rnaForGene) {
      const group = cellLineGroups.get(row.cellLine) ?? [];
      group.push(row);
      cellLineGroups.set(row.cellLine, group);
    }
    const cellLinesFormatted = [...cellLineGroups.entries()]
      .map(([cellLine, rows]) => {
        const meta = metaMap.get(cellLine);
        const tpm = sameNumber(rows.map((r) => r.tpm));
        const nTPM = sameNumber(rows.map((r) => r.nTPM));
        const pTPM = sameNumber(rows.map((r) => r.pTPM));
        return {
          cellLine,
          cancerCellLine: meta?.cancerCellLine ?? null,
          diseaseSubtype: meta?.diseaseSubtype ?? null,
          primaryMetastasis: meta?.primaryMetastasis ?? null,
          tpm: tpm.value,
          nTPM: nTPM.value,
          pTPM: pTPM.value,
          rawRowCount: rows.length,
          valueStatus: tpm.status === "discordant" || nTPM.status === "discordant" || pTPM.status === "discordant"
            ? "discordant" : "consistent",
        };
      })
      .sort((a, b) => (b.nTPM ?? -Infinity) - (a.nTPM ?? -Infinity));

    const patientRnaFormatted = patRnaRows
      .sort((a, b) => (b.pTPM ?? 0) - (a.pTPM ?? 0))
      .map((r) => ({
        sample: r.sample,
        tissue: r.tissue,
        pTPM: r.pTPM ?? 0,
      }));

    const dataAvailability = {
      ihc: ihcFormatted.length > 0,
      prognosis: progFormatted.length > 0,
      cellLine: cellLinesFormatted.length > 0,
      patientRna: patientRnaFormatted.length > 0,
      clinical: clinicalContext.available,
    };

    const annotationObj = annotation
      ? {
          source: "MyGene.info + KEGG + Reactome",
          functionSummary: annotation.summary,
          originalFunctionSummary: annotation.originalSummary,
          biologicalProcesses: annotation.biologicalProcesses,
          molecularFunctions: annotation.molecularFunctions,
          cellularComponents: annotation.cellularComponents,
          diseases: annotation.diseases,
          pathways: annotation.pathways,
          openTargetsScore: null,
          openTargetsUrl: ensemblId
            ? `https://platform.opentargets.org/target/${ensemblId}`
            : null,
          uniprotUrl: annotation.uniprotId
            ? `https://www.uniprot.org/uniprotkb/${annotation.uniprotId}`
            : null,
          localization: annotation.localization,
        }
      : null;

    res.json({
      gene: {
        ensemblId,
        symbol,
        name,
        originalName: annotation?.originalName ?? name,
        chromosome: annotation?.chromosome ?? null,
        uniprotId: annotation?.uniprotId ?? null,
        ncbiGeneId: annotation?.ncbiGeneId ?? null,
        summary: annotation?.summary ?? null,
        originalSummary: annotation?.originalSummary ?? null,
        location: annotation?.chromosome ?? null,
      },
      annotation: annotationObj,
      ihc: ihcFormatted,
      prognosis: progFormatted,
      cellLines: cellLinesFormatted,
      cellLineCounts: {
        rawRows: rnaForGene.length,
        uniqueCellLines: cellLinesFormatted.length,
        duplicateRows: Math.max(0, rnaForGene.length - cellLinesFormatted.length),
        discordantCellLines: cellLinesFormatted.filter((row) => row.valueStatus === "discordant").length,
      },
      patientRna: patientRnaFormatted,
      clinicalContext,
      dataAvailability,
      localization: annotation?.localization ?? {
        requestedLocale: locale,
        resolvedLocale: "en",
        status: locale === "id" ? "fallback" : "source",
      },
    });
  } catch (err) {
    logger.error({ err }, "IBCE gene dossier error");
    res.status(500).json({ error: "Failed to fetch gene dossier" });
  }
});

// ── GET /ibce/gene/:geneId/survival ─────────────────────────────────────────
// Joins patient RNA expression with TCGA-BRCA clinical data.
// Splits patients by median expression into high/low groups.
// Returns raw (time, event) arrays for frontend KM computation.

router.get("/gene/:geneId/survival", async (req, res) => {
  const geneId = req.params["geneId"]?.trim();
  if (!geneId) { res.status(400).json({ error: "geneId required" }); return; }

  try {
    const isEnsg = geneId.toUpperCase().startsWith("ENSG");
    let ensemblId: string | null = isEnsg ? geneId : null;

    // Resolve ensemblId from local tables (patient RNA stores by ensembl_id only)
    if (!ensemblId) {
      const hit = await db.select({ e: ibceIhcBrca.ensemblId }).from(ibceIhcBrca)
        .where(ilike(ibceIhcBrca.geneName, geneId)).limit(1);
      ensemblId = hit[0]?.e ?? null;
    }
    if (!ensemblId) {
      const hit = await db.select({ e: ibcePrognosisBrca.ensemblId }).from(ibcePrognosisBrca)
        .where(ilike(ibcePrognosisBrca.geneName, geneId)).limit(1);
      ensemblId = hit[0]?.e ?? null;
    }
    if (!ensemblId) {
      res.status(404).json({ error: "Gene not found in any IBCE table" });
      return;
    }

    // Get all patient RNA rows for this gene
    const rnaRows = await db
      .select({ sample: ibcePatientRna.sample, pTPM: ibcePatientRna.pTPM })
      .from(ibcePatientRna)
      .where(eq(ibcePatientRna.ensemblId, ensemblId));

    const { expressionByCase, quality } = selectPrimaryTumorExpression(rnaRows);
    const barcodes = [...expressionByCase.keys()];
    if (barcodes.length < 10) {
      res.status(404).json({ error: "Fewer than 10 eligible primary-tumor RNA cases", quality });
      return;
    }

    // Fetch matching clinical records
    const clinRows = await db
      .select({
        caseBarcode: ibceClinicalBrca.caseBarcode,
        vitalStatus: ibceClinicalBrca.vitalStatus,
        daysToLastFollowUp: ibceClinicalBrca.daysToLastFollowUp,
        daysToDeath: ibceClinicalBrca.daysToDeath,
      })
      .from(ibceClinicalBrca)
      .where(inArray(ibceClinicalBrca.caseBarcode, barcodes));

    const analysis = analyzeSurvival(expressionByCase, clinRows, quality);
    if (!analysis.ok) {
      res.status(404).json({ error: analysis.reason, quality: analysis.quality });
      return;
    }
    logger.info({ gene: geneId, nJoint: analysis.quality.nAnalyzedCases, nHigh: analysis.nHigh, nLow: analysis.nLow }, "IBCE survival computed");
    res.json(analysis);
  } catch (err) {
    logger.error({ err }, "IBCE survival endpoint error");
    res.status(500).json({ error: "Failed to compute survival data" });
  }
});

// ── GET /ibce/clinical/summary ───────────────────────────────────────────────

router.get("/clinical/summary", async (_req, res) => {
  try {
    const rows = await db.select().from(ibceClinicalBrca);
    if (!rows.length) {
      res.json({ available: false, nPatients: 0 });
      return;
    }

    const nPatients = rows.length;

    // Vital status
    const vitalMap: Record<string, number> = {};
    for (const r of rows) {
      const k = r.vitalStatus ?? "Unknown";
      vitalMap[k] = (vitalMap[k] ?? 0) + 1;
    }

    // Stage distribution
    const stageMap: Record<string, number> = {};
    for (const r of rows) {
      const k = r.ajccStage ?? "Unknown";
      stageMap[k] = (stageMap[k] ?? 0) + 1;
    }
    const stageDistribution = Object.entries(stageMap)
      .sort((a, b) => b[1] - a[1])
      .map(([stage, count]) => ({ stage, count }));

    // Median age at diagnosis
    const ages = rows.map(r => r.ageAtDiagnosis).filter((a): a is number => a != null).sort((a, b) => a - b);
    const medianAgeDiagnosis = ages.length > 0 ? ages[Math.floor(ages.length / 2)] : null;

    // Median survival (days to death for deceased patients)
    const survivalDays = rows
      .filter(r => r.vitalStatus === "Dead" && r.daysToDeath != null)
      .map(r => r.daysToDeath as number)
      .sort((a, b) => a - b);
    const medianSurvivalDays = survivalDays.length > 0 ? survivalDays[Math.floor(survivalDays.length / 2)] : null;

    // Race distribution (top 5)
    const raceMap: Record<string, number> = {};
    for (const r of rows) {
      const k = r.race ?? "Not Reported";
      raceMap[k] = (raceMap[k] ?? 0) + 1;
    }
    const raceDistribution = Object.entries(raceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([race, count]) => ({ race, count }));

    res.json({
      available: true,
      nPatients,
      vitalStatusSummary: vitalMap,
      stageDistribution,
      medianAgeDiagnosis,
      medianSurvivalDays,
      raceDistribution,
    });
  } catch (err) {
    logger.error({ err }, "IBCE clinical summary error");
    res.status(500).json({ error: "Failed to fetch clinical summary" });
  }
});

// ── POST /ibce/ingest ────────────────────────────────────────────────────────

router.post("/ingest", async (req, res) => {
  const { dataset } = req.body as { dataset?: string };
  const validKeys: DatasetKey[] = ["ihc", "prognosis", "cellline_meta", "cellline_rna", "patient_rna", "clinical", "all"];
  if (!dataset || !validKeys.includes(dataset as DatasetKey)) {
    res.status(400).json({ error: `dataset must be one of: ${validKeys.join(", ")}` });
    return;
  }

  logger.info({ dataset }, "IBCE ingest started");
  const result = await ingestDataset(dataset as DatasetKey);
  logger.info({ result }, "IBCE ingest complete");
  res.json(result);
});

// ── GET /ibce/references ─────────────────────────────────────────────────────

router.get("/references", (req, res) => {
  const style = (req.query["style"] as "harvard" | "apa" | "vancouver") ?? "harvard";
  const validStyles = ["harvard", "apa", "vancouver"];
  const chosenStyle = validStyles.includes(style) ? style : "harvard";

  res.json(
    IBCE_REFERENCES.map((ref) => ({
      id: ref.id,
      authors: ref.authors,
      year: ref.year,
      title: ref.title,
      journal: ref.journal,
      doi: ref.doi,
      pmid: ref.pmid,
      url: ref.url,
      formatted: formatReference(ref, chosenStyle as "harvard" | "apa" | "vancouver"),
    })),
  );
});

export default router;
