import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  uuid,
  bigint,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const ibceIhcBrca = pgTable("ibce_ihc_brca", {
  id: serial("id").primaryKey(),
  ensemblId: text("ensembl_id").notNull(),
  geneName: text("gene_name").notNull(),
  cancer: text("cancer").notNull(),
  high: integer("high").notNull().default(0),
  medium: integer("medium").notNull().default(0),
  low: integer("low").notNull().default(0),
  notDetected: integer("not_detected").notNull().default(0),
});

export const ibcePrognosisBrca = pgTable("ibce_prognosis_brca", {
  id: serial("id").primaryKey(),
  ensemblId: text("ensembl_id").notNull(),
  geneName: text("gene_name").notNull(),
  cancer: text("cancer").notNull(),
  classification: text("classification").notNull(),
  pValue: doublePrecision("p_value"),
});

export const ibceCelllineMeta = pgTable("ibce_cellline_meta", {
  cellLine: text("cell_line").primaryKey(),
  cancerCellLine: text("cancer_cell_line"),
  primaryDisease: text("primary_disease"),
  diseaseSubtype: text("disease_subtype"),
  primaryMetastasis: text("primary_metastasis"),
  patient: text("patient"),
  sampleCollectionSite: text("sample_collection_site"),
  cellosaurusId: text("cellosaurus_id"),
});

export const ibceCelllineRna = pgTable("ibce_cellline_rna", {
  id: serial("id").primaryKey(),
  ensemblId: text("ensembl_id").notNull(),
  geneName: text("gene_name").notNull(),
  cellLine: text("cell_line").notNull(),
  tpm: doublePrecision("tpm"),
  pTPM: doublePrecision("ptpm"),
  nTPM: doublePrecision("ntpm"),
}, (table) => [
  uniqueIndex("ibce_cellline_rna_gene_cell_line_unique").on(table.ensemblId, table.cellLine),
]);

// Preserve the original pre-cleanup snapshot as its own table. The production
// copy was created with CREATE TABLE AS and therefore has no inherited
// constraints; keep this definition nullable to match that existing table.
export const ibceCelllineRnaBackup = pgTable("ibce_cellline_rna_backup_before_dedup", {
  id: integer("id"),
  ensemblId: text("ensembl_id"),
  geneName: text("gene_name"),
  cellLine: text("cell_line"),
  tpm: doublePrecision("tpm"),
  pTPM: doublePrecision("ptpm"),
  nTPM: doublePrecision("ntpm"),
});

export const ibcePatientRna = pgTable("ibce_patient_rna", {
  id: serial("id").primaryKey(),
  ensemblId: text("ensembl_id").notNull(),
  geneName: text("gene_name").notNull(),
  sample: text("sample").notNull(),
  tissue: text("tissue").notNull(),
  cellType: text("cell_type"),
  tpm: doublePrecision("tpm"),
  pTPM: doublePrecision("ptpm"),
  nTPM: doublePrecision("ntpm"),
});

export const ibceClinicalBrca = pgTable("ibce_clinical_brca", {
  id: serial("id").primaryKey(),
  caseBarcode: text("case_barcode").notNull().unique(),
  vitalStatus: text("vital_status"),
  ageAtIndex: integer("age_at_index"),
  ageAtDiagnosis: integer("age_at_diagnosis"),
  daysToDeath: integer("days_to_death"),
  daysToLastFollowUp: integer("days_to_last_follow_up"),
  daysToRecurrence: integer("days_to_recurrence"),
  ajccStage: text("ajcc_stage"),
  ajccT: text("ajcc_t"),
  ajccN: text("ajcc_n"),
  ajccM: text("ajcc_m"),
  primaryDiagnosis: text("primary_diagnosis"),
  morphology: text("morphology"),
  race: text("race"),
  sex: text("sex"),
});

export const ibceIngestLog = pgTable("ibce_ingest_log", {
  id: serial("id").primaryKey(),
  dataset: text("dataset").notNull(),
  rowsIngested: integer("rows_ingested").notNull(),
  durationMs: doublePrecision("duration_ms").notNull(),
  ok: boolean("ok").notNull(),
  error: text("error"),
  ingestedAt: timestamp("ingested_at").notNull().defaultNow(),
});

export const ibceExportHistory = pgTable("ibce_export_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  exportKind: text("export_kind").notNull(),
  datasetKey: text("dataset_key"),
  filename: text("filename").notNull(),
  status: text("status").notNull(),
  rows: bigint("rows", { mode: "number" }),
  bytes: bigint("bytes", { mode: "number" }),
  sha256: text("sha256"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorSummary: text("error_summary"),
});

export type IbceExportHistory = typeof ibceExportHistory.$inferSelect;

export type IbceAuditValue = string | number | null;
export type IbceAuditChangedFields = Record<string, {
  before: IbceAuditValue;
  after: IbceAuditValue;
}>;
export type IbceAuditCounts = {
  totalRows: number;
  uniquePairs: number;
  duplicateRows: number;
  conflictingPairs: number;
  maxCopies: number;
};

export const ibceAdminHistory = pgTable("ibce_admin_history", {
  id: serial("id").primaryKey(),
  operation: text("operation").notNull(),
  actorEmail: text("actor_email").notNull(),
  actorRole: text("actor_role").notNull(),
  rnaRowId: integer("rna_row_id"),
  changedFields: jsonb("changed_fields").$type<IbceAuditChangedFields>(),
  preflightCounts: jsonb("preflight_counts").$type<IbceAuditCounts>(),
  backupName: text("backup_name"),
  deletedCount: integer("deleted_count"),
  finalCounts: jsonb("final_counts").$type<IbceAuditCounts>(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export type IbceAdminHistory = typeof ibceAdminHistory.$inferSelect;
