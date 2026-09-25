import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useLocation } from 'wouter';
import { Database, Dna, ExternalLink, Languages, LoaderCircle, X, GitCompareArrows } from 'lucide-react';
import {
  type IbceAnnotationItem,
  type IbceGeneDossier,
} from '@workspace/api-client-react';
import { IhcPanel } from './ihc-panel';
import { KmPanel } from './km-panel';
import { CellLinePanel } from './cellline-panel';
import { PatientRnaPanel } from './patient-rna-panel';
import { AiInterpretation, type InterpretationGene } from './ai-interpretation';
import { InfoTooltip, ScientificTooltip } from './scientific-tooltip';
import type { IbceGlossaryKey } from './tooltip-catalog';
import { useIbceLocale } from './locale';
import { IbceSectionNav } from './section-nav';
import './ibce.css';

const CellLinePanelWithInterpretation = CellLinePanel as React.ComponentType<React.ComponentProps<typeof CellLinePanel> & { interpretation?: React.ReactNode }>;

/* ── Annotation helpers (unchanged) ──────────────────────────────────────── */

const SOURCE_META: Record<string, { label: string; pillClass: string; badgeClass: string }> = {
  'KEGG':     { label: 'KEGG',     pillClass: 'ibce-pill-kegg',     badgeClass: 'ibce-source-kegg' },
  'Reactome': { label: 'Reactome', pillClass: 'ibce-pill-reactome', badgeClass: 'ibce-source-reactome' },
  'GO:BP':    { label: 'GO:BP',    pillClass: 'ibce-pill-gobp',     badgeClass: 'ibce-source-gobp' },
  'GO:MF':    { label: 'GO:MF',    pillClass: 'ibce-pill-gomf',     badgeClass: 'ibce-source-gomf' },
  'GO:CC':    { label: 'GO:CC',    pillClass: 'ibce-pill-gocc',     badgeClass: 'ibce-source-gocc' },
};

function AnnotPill({ item }: { item: IbceAnnotationItem }) {
  const { t } = useIbceLocale();
  const meta = SOURCE_META[item.source] ?? SOURCE_META['KEGG'];
  const glossaryKey: IbceGlossaryKey =
    item.source === 'GO:BP' ? 'biologicalProcess'
      : item.source === 'GO:MF' ? 'molecularFunction'
        : item.source === 'GO:CC' ? 'cellularComponent'
        : item.source === 'Reactome' ? 'reactome'
          : 'kegg';
  const inner = (
    <>
      <span>{item.name}</span>
      {item.id && <span className="ibce-pill-id">{item.id}</span>}
      {item.url && <ExternalLink size={10} className="ibce-pill-ext" />}
    </>
  );
  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`ibce-annot-pill ${meta.pillClass}`}
        aria-label={`${t('open')} ${item.name} ${item.source}${item.id ? `, ${item.id}` : ''}`}
        title={`${t('open')} ${item.name} ${item.source}${item.originalName && item.originalName !== item.name ? ` | ${t('originalSourceText')}: ${item.originalName}` : ''}`}
      >
        {inner}
      </a>
    );
  }
  return <ScientificTooltip entryKey={glossaryKey}><span className={`ibce-annot-pill ${meta.pillClass}`}>{inner}</span></ScientificTooltip>;
}

function AnnotGroup({ title, items, source }: { title: string; items: IbceAnnotationItem[]; source: string }) {
  if (!items?.length) return null;
  const meta = SOURCE_META[source];
  return (
    <div className="ibce-annot-group">
      <div className="ibce-annot-group-label">
        <h3>{title}</h3>
        <InfoTooltip entryKey={source === 'GO:BP' ? 'biologicalProcess' : source === 'GO:CC' ? 'cellularComponent' : 'molecularFunction'} />
        {meta && <span className={`ibce-source-badge ${meta.badgeClass}`}>{meta.label}</span>}
      </div>
      <div className="ibce-annot-items">
        {items.map((item, i) => <AnnotPill key={item.id ?? i} item={item} />)}
      </div>
    </div>
  );
}

function PathwayGroup({ pathways }: { pathways: IbceAnnotationItem[] }) {
  const { t } = useIbceLocale();
  if (!pathways?.length) return null;
  const kegg = pathways.filter(p => p.source === 'KEGG');
  const reactome = pathways.filter(p => p.source === 'Reactome');
  return (
    <>
      {kegg.length > 0 && (
        <div className="ibce-annot-group">
          <div className="ibce-annot-group-label">
             <h3>KEGG {t('pathways')}</h3>
            <InfoTooltip entryKey="kegg" />
            <span className="ibce-source-badge ibce-source-kegg">KEGG</span>
          </div>
          <div className="ibce-annot-items">
            {kegg.map((item, i) => <AnnotPill key={item.id ?? i} item={item} />)}
          </div>
        </div>
      )}
      {reactome.length > 0 && (
        <div className="ibce-annot-group" style={{ marginTop: kegg.length > 0 ? 20 : 0 }}>
          <div className="ibce-annot-group-label">
             <h3>Reactome {t('pathways')}</h3>
            <InfoTooltip entryKey="reactome" />
            <span className="ibce-source-badge ibce-source-reactome">Reactome</span>
          </div>
          <div className="ibce-annot-items">
            {reactome.map((item, i) => <AnnotPill key={item.id ?? i} item={item} />)}
          </div>
        </div>
      )}
    </>
  );
}

type Annotation = NonNullable<IbceGeneDossier['annotation']>;
type AnnotationSection = 'function' | 'kegg' | 'reactome' | 'biological' | 'molecular' | 'cellular';

function ComparisonAnnotationItem({ annotation, section }: { annotation: Annotation | null; section: AnnotationSection }) {
  const { t } = useIbceLocale();
  if (!annotation) return <p className="ibce-muted ibce-small">{t('noAnnotation')}</p>;
  if (section === 'function') {
    return annotation.functionSummary
      ? <p className="ibce-muted" style={{ lineHeight: 1.65, fontSize: 14, margin: 0 }}>{annotation.functionSummary}</p>
      : <p className="ibce-muted ibce-small">{t('noAnnotation')}</p>;
  }
  const items = section === 'kegg' || section === 'reactome'
    ? (annotation.pathways ?? []).filter(item => item.source === (section === 'kegg' ? 'KEGG' : 'Reactome'))
    : section === 'biological' ? annotation.biologicalProcesses ?? []
      : section === 'molecular' ? annotation.molecularFunctions ?? []
        : annotation.cellularComponents ?? [];
  return items.length
    ? <div className="ibce-annot-items">{items.map((item, index) => <AnnotPill key={item.id ?? index} item={item} />)}</div>
    : <p className="ibce-muted ibce-small">{section === 'kegg' || section === 'reactome' ? t('noAnnotation') : t('noGo')}</p>;
}

function IdentityCrosswalk({ gene, annotation, ensemblUrl, ncbiUrl, compact = false }: {
  gene: NonNullable<IbceGeneDossier['gene']>;
  annotation: Annotation | null;
  ensemblUrl: string | null;
  ncbiUrl: string | null;
  compact?: boolean;
}) {
  const { t } = useIbceLocale();
  return (
    <section className="ibce-panel" style={compact ? { maxWidth: 480 } : undefined} aria-label={`${t('identity')}: ${gene.symbol || gene.name}`}>
      <div className="ibce-eyebrow">{t('identity')} <InfoTooltip entryKey="identityCrosswalk" /></div>
      {!compact && <h3 className="ibce-serif" style={{ margin: '8px 0 12px' }}>{gene.symbol || gene.name}</h3>}
      {[
        { label: 'UniProt', id: gene.uniprotId, url: annotation?.uniprotUrl },
        { label: 'NCBI Gene', id: gene.ncbiGeneId, url: ncbiUrl },
        { label: 'Ensembl', id: gene.ensemblId, url: ensemblUrl },
        { label: 'Open Targets', id: gene.ensemblId ? t('targetProfile') : null, url: annotation?.openTargetsUrl },
      ].map(row => row.id && (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '9px 0', fontSize: 12 }}>
          <b style={{ minWidth: 100, color: 'hsl(var(--muted-foreground))' }}>{row.label}</b>
          {row.url
            ? <a className="ibce-xwalk-link" href={row.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="ibce-mono">{row.id}</span><ExternalLink size={11} />
              </a>
            : <span className="ibce-mono">{row.id}</span>}
        </div>
      ))}
    </section>
  );
}

function GeneComparisonCard({ gene, annotation, summary, ensemblUrl, ncbiUrl, label }: {
  gene: NonNullable<IbceGeneDossier['gene']>;
  annotation: NonNullable<IbceGeneDossier['annotation']> | null;
  summary?: string | null;
  ensemblUrl: string | null;
  ncbiUrl: string | null;
  label: string;
}) {
  return (
    <section className="ibce-panel" aria-label={`${label}: ${gene.symbol ?? gene.name ?? 'gene'}`}>
      <div className="ibce-eyebrow">{label}</div>
      <div className="ibce-gene-symbol">{gene.symbol || 'Unavailable'}</div>
      <div className="ibce-idline">
        <span>{gene.name || 'Name unavailable'}</span>
        {gene.ensemblId && <><span className="sep">·</span><a href={ensemblUrl ?? undefined} target="_blank" rel="noopener noreferrer">{gene.ensemblId}</a></>}
      </div>
      <p style={{ lineHeight: 1.6, fontSize: 13, margin: '14px 0 0' }}>
        {summary || 'No source summary is available for this gene.'}
      </p>
      <div className="ibce-idline" style={{ marginTop: 12 }}>
        {gene.ncbiGeneId && (ncbiUrl
          ? <a href={ncbiUrl} target="_blank" rel="noopener noreferrer">NCBI Gene: {gene.ncbiGeneId} <ExternalLink size={11} /></a>
          : <span>NCBI Gene: {gene.ncbiGeneId}</span>)}
        {gene.uniprotId && (
          <a href={annotation?.uniprotUrl || `https://www.uniprot.org/uniprotkb/${encodeURIComponent(gene.uniprotId)}/entry`} target="_blank" rel="noopener noreferrer">
            UniProt: {gene.uniprotId} <ExternalLink size={11} />
          </a>
        )}
      </div>
    </section>
  );
}

function annotationObservations(annotation: NonNullable<IbceGeneDossier['annotation']> | null): string[] {
  if (!annotation) return ['No functional annotation is available in the dossier.'];
  return [
    annotation.functionSummary ? `Function summary: ${annotation.functionSummary}` : '',
    ...(annotation.biologicalProcesses ?? []).slice(0, 10).map(item => `GO biological process: ${item.name}`),
    ...(annotation.molecularFunctions ?? []).slice(0, 10).map(item => `GO molecular function: ${item.name}`),
    ...(annotation.cellularComponents ?? []).slice(0, 10).map(item => `GO cellular component: ${item.name}`),
    ...(annotation.pathways ?? []).slice(0, 10).map(item => `Pathway: ${item.name}`),
  ].filter(Boolean).slice(0, 10);
}

function interpretationGene(gene: NonNullable<IbceGeneDossier['gene']>, observations: string[]): InterpretationGene {
  return { gene: gene.symbol || gene.name || 'Unknown gene', summary: gene.summary || undefined, observations };
}

/* ── Main dossier component ───────────────────────────────────────────────── */
function useLocalizedDossier(gene: string, locale: 'en' | 'id') {
  return useQuery<IbceGeneDossier>({
    queryKey: ['ibce', 'gene-dossier', gene, locale],
    enabled: !!gene,
    queryFn: async () => {
      const response = await fetch(`/api/ibce/gene/${encodeURIComponent(gene)}?locale=${locale}`);
      if (!response.ok) throw new Error(`Gene dossier unavailable (${response.status})`);
      return response.json() as Promise<IbceGeneDossier>;
    },
  });
}

function DossierLoading({ gene }: { gene: string }) {
  const { t } = useIbceLocale();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [gene]);

  const activeStep = elapsedSeconds < 3 ? 0 : elapsedSeconds < 7 ? 1 : 2;
  const steps = [
    { icon: Database, label: t('loadingLocal') },
    { icon: Dna, label: t('loadingAnnotation') },
    { icon: Languages, label: t('loadingLocalization') },
  ];

  return (
    <div className="ibce-wrap">
      <div className="ibce-page">
        <section className="ibce-dossier-loader" aria-live="polite" aria-busy="true">
          <div className="ibce-loader-orbit" aria-hidden="true">
            <span />
            <LoaderCircle size={34} />
          </div>
          <div className="ibce-eyebrow">{t('retrieving')}</div>
          <h1>{t('resolving', { gene: gene.toUpperCase() })}</h1>
          <p>{t('loadingPatience')}</p>
          <div className="ibce-loading-steps">
            {steps.map(({ icon: Icon, label }, index) => (
              <div className={`ibce-loading-step ${index <= activeStep ? 'is-active' : ''}`} key={label}>
                <span className="ibce-loading-step-icon"><Icon size={16} /></span>
                <span>{label}</span>
                {index === activeStep && <span className="ibce-loading-pulse" aria-hidden="true" />}
              </div>
            ))}
          </div>
          <span className="ibce-loading-time">{elapsedSeconds}s</span>
        </section>
      </div>
    </div>
  );
}

export default function IBCEDossier() {
  const { geneId = '' } = useParams<{ geneId: string }>();
  const [, setLoc] = useLocation();
  const { lang, t } = useIbceLocale();

  // Gene comparison state
  const [compareInput, setCompareInput] = useState('');
  const [compareGene, setCompareGene] = useState('');

  const { data: dossier, isLoading, error } = useLocalizedDossier(geneId, lang);

  const {
    data: compareDossier,
    isLoading: isCompareLoading,
    error: compareError,
  } = useLocalizedDossier(compareGene, lang);

  if (isLoading) {
    return <DossierLoading gene={geneId} />;
  }

  if (error || !dossier) {
    return (
      <div className="ibce-wrap">
        <div className="ibce-page">
          <div className="ibce-empty">
            {t('unresolved')} <Link href="/ibce" style={{ color: 'hsl(var(--primary))' }}>{t('discovery')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const g = dossier.gene;
  const a = dossier.annotation;
  const ihc = dossier.ihc || [];
  const prognosis = dossier.prognosis || [];
  const cells = [...(dossier.cellLines || [])].sort((x, y) => y.nTPM - x.nTPM);
  const patientRna = dossier.patientRna ?? [];

  const compareCells = compareDossier?.cellLines
    ? [...compareDossier.cellLines].sort((x, y) => y.nTPM - x.nTPM)
    : undefined;
  const comparePatientRna = compareDossier?.patientRna ?? undefined;
  const comparisonReady = !!(compareGene && compareDossier && !compareError);
  const activeCompareGene = comparisonReady
    ? compareDossier.gene.symbol ?? compareGene
    : undefined;

  const ensemblUrl = g.ensemblId
    ? `https://www.ensembl.org/Homo_sapiens/Gene/Summary?g=${g.ensemblId}`
    : null;
  const ncbiUrl = g.ncbiGeneId
    ? `https://www.ncbi.nlm.nih.gov/gene/${g.ncbiGeneId}`
    : null;
  const cg = compareDossier?.gene;
  const compareEnsemblUrl = cg?.ensemblId
    ? `https://www.ensembl.org/Homo_sapiens/Gene/Summary?g=${cg.ensemblId}`
    : null;
  const compareNcbiUrl = cg?.ncbiGeneId
    ? `https://www.ncbi.nlm.nih.gov/gene/${cg.ncbiGeneId}`
    : null;
  const ihcObservations = (rows: typeof ihc) => rows.length
    ? rows.slice(0, 10).map(r => `${r.cancer}: high ${r.high}, medium ${r.medium}, low ${r.low}, not detected ${r.notDetected}, total ${r.total}`)
    : ['No IHC observations are available.'];
  const prognosisObservations = (rows: typeof prognosis) => rows.length
    ? rows.slice(0, 10).map(r => `${r.cancer}: classification ${r.classification}; p-value ${r.pValue ?? 'not reported'}`)
    : ['No prognostic association observations are available.'];
  const cellObservations = (rows: typeof cells) => rows.length
    ? [`${rows.length} cell-line records; nTPM range ${Math.min(...rows.map(r => r.nTPM)).toFixed(2)}–${Math.max(...rows.map(r => r.nTPM)).toFixed(2)}`, ...rows.slice(0, 9).map(r => `${r.cellLine}: nTPM ${r.nTPM.toFixed(2)}`)]
    : ['No cell-line RNA observations are available.'];
  const patientObservations = (rows: typeof patientRna) => rows.length
    ? [`${rows.length} patient cancer-sample records; pTPM range ${Math.min(...rows.map(r => r.pTPM)).toFixed(2)}–${Math.max(...rows.map(r => r.pTPM)).toFixed(2)}`, `Tissue categories represented: ${[...new Set(rows.map(r => r.tissue))].slice(0, 8).join(', ')}`]
    : ['No patient RNA observations are available.'];
  const primaryInterpretation = (panel: 'ihc' | 'prognosis' | 'cellLine' | 'patientRna' | 'functional', observations: string[], compareObservations?: string[]) => (
    <AiInterpretation
      panel={panel}
      locale={lang}
      primary={interpretationGene(g, observations)}
      comparison={comparisonReady && cg ? interpretationGene(cg, compareObservations ?? []) : undefined}
      key={JSON.stringify({ panel, locale: lang, primary: interpretationGene(g, observations), comparison: comparisonReady && cg ? interpretationGene(cg, compareObservations ?? []) : undefined })}
    />
  );

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = compareInput.trim().toUpperCase();
    if (trimmed && trimmed !== geneId.toUpperCase()) {
      setCompareGene(trimmed);
      setCompareInput('');
    }
  };

  return (
    <div className="ibce-wrap">
      <div className="ibce-page">

        {/* Breadcrumb */}
        <div className="ibce-eyebrow" style={{ marginBottom: 8 }}>
          <button
            onClick={() => setLoc('/ibce')}
            style={{ background: 'none', border: 0, color: 'hsl(var(--primary))', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 700, padding: 0 }}
          >
            {t('discovery')}
          </button>
          {' / '}{t('dossier')}
        </div>
        <IbceSectionNav />

        {/* Gene header */}
        {!comparisonReady && <div className="ibce-gene-head">
          <div>
            <div className="ibce-gene-symbol">
              <ScientificTooltip entryKey="geneSymbol">{g.symbol}</ScientificTooltip>
            </div>
            <div className="ibce-idline">
              <span>{g.name}</span>
              <span className="sep">·</span>
              <span>{g.chromosome || t('notAnnotated')}</span>
              <span className="sep">·</span>
              {ensemblUrl
                ? <><a href={ensemblUrl} target="_blank" rel="noopener noreferrer">{g.ensemblId}</a><InfoTooltip entryKey="ensemblId" /></>
                : <ScientificTooltip entryKey="ensemblId">{g.ensemblId}</ScientificTooltip>}
            </div>
          </div>
          <div className="ibce-availability">
            <InfoTooltip entryKey="dataAvailability" />
            {Object.entries(dossier.dataAvailability).map(([k, v]) => (
              <span className={`ibce-avail ${v ? 'on' : ''}`} key={k} aria-label={`${k}: ${v ? t('dataAvailable') : t('noDataAvailable')}`}>
                {v ? '●' : '○'} {k}
              </span>
            ))}
          </div>
        </div>}

        {!comparisonReady && <p style={{ maxWidth: 850, lineHeight: 1.65, fontSize: 15, marginTop: 24, color: 'hsl(var(--muted-foreground))' }}>
          {g.summary || t('unavailableSummary')}
        </p>}
        {comparisonReady && cg && (
          <div className="ibce-grid ibce-grid-2" style={{ marginTop: 22 }}>
            <GeneComparisonCard gene={g} annotation={a ?? null} summary={g.summary} ensemblUrl={ensemblUrl} ncbiUrl={ncbiUrl} label="Primary gene" />
            <GeneComparisonCard gene={cg} annotation={compareDossier.annotation ?? null} summary={cg.summary} ensemblUrl={compareEnsemblUrl} ncbiUrl={compareNcbiUrl} label="Comparison gene" />
          </div>
        )}
        {lang === 'id' && dossier.localization?.status === 'fallback' && (
          <div className="ibce-localization-warning" role="status">{t('sourceEnglishWarning')}</div>
        )}
        {lang === 'id' && dossier.localization?.status === 'translated' && g.originalSummary && g.originalSummary !== g.summary && (
          <details className="ibce-original-source">
            <summary>{t('originalSourceText')}</summary>
            <p>{g.originalSummary}</p>
          </details>
        )}

        {/* Identity crosswalk */}
        <div className={`ibce-grid ${comparisonReady ? 'ibce-grid-2' : ''}`} style={{ marginTop: 32 }}>
          <IdentityCrosswalk gene={g} annotation={a ?? null} ensemblUrl={ensemblUrl} ncbiUrl={ncbiUrl} compact={!comparisonReady} />
          {comparisonReady && cg && (
            <IdentityCrosswalk gene={cg} annotation={compareDossier.annotation ?? null} ensemblUrl={compareEnsemblUrl} ncbiUrl={compareNcbiUrl} />
          )}
        </div>

        {/* ── Gene comparison bar ──────────────────────────────────────────── */}
        <div className="ibce-compare-bar">
          <GitCompareArrows size={16} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
           <span className="ibce-compare-label">{t('compareWith')} <InfoTooltip entryKey="geneComparison" /></span>
          {compareGene
            ? (
              <div className="ibce-compare-chip">
                <span>{compareGene}</span>
                 <button onClick={() => setCompareGene('')} aria-label={t('removeComparison', { gene: compareGene })}>
                  <X size={12} />
                </button>
              </div>
            )
            : (
              <form onSubmit={handleCompare} className="ibce-compare-form">
                <input
                  className="ibce-compare-input"
                  value={compareInput}
                  onChange={e => setCompareInput(e.target.value)}
                   placeholder={t('comparePlaceholder')}
                  autoComplete="off"
                  spellCheck={false}
                    aria-label={t('compareAria')}
                />
                <button type="submit" className="ibce-compare-btn" disabled={!compareInput.trim()}>
                   {t('compare')}
                </button>
              </form>
            )}
          {compareGene && compareDossier && (
            <span className="ibce-compare-status">
               {t('loaded', { gene: compareDossier.gene.symbol })}
            </span>
          )}
          {compareGene && isCompareLoading && (
             <span className="ibce-compare-status">{t('loading', { gene: compareGene })}</span>
          )}
          {compareGene && compareError && (
            <span className="ibce-compare-status error">
               {t('compareFailed', { gene: compareGene })}
            </span>
          )}
        </div>

        {/* ── Data panels ─────────────────────────────────────────────────── */}

        {/* Row 1: IHC (A) + Kaplan-Meier/Prognosis (B) */}
        <div className={`ibce-panels-two-col ${comparisonReady ? 'comparison-active' : ''}`}>
          <IhcPanel
            data={ihc}
            gene={g.symbol ?? geneId}
            compareData={comparisonReady ? compareDossier.ihc : undefined}
            compareGene={activeCompareGene}
            interpretation={primaryInterpretation('ihc', ihcObservations(ihc), comparisonReady ? ihcObservations(compareDossier.ihc || []) : undefined)}
          />
          <KmPanel
            prognosis={prognosis}
            gene={g.symbol ?? geneId}
            ensemblId={g.ensemblId ?? null}
            comparePrognosis={comparisonReady ? compareDossier.prognosis : undefined}
            compareGene={activeCompareGene}
            interpretation={primaryInterpretation('prognosis', prognosisObservations(prognosis), comparisonReady ? prognosisObservations(compareDossier.prognosis || []) : undefined)}
          />
        </div>

        {/* Row 2: Cell lines (C) - full width */}
        <CellLinePanelWithInterpretation
          data={cells}
          gene={g.symbol ?? geneId}
          compareData={comparisonReady ? compareCells : undefined}
          compareGene={activeCompareGene}
          interpretation={primaryInterpretation('cellLine', cellObservations(cells), comparisonReady ? cellObservations(compareCells || []) : undefined)}
        />

        {/* Row 3: Patient RNA (D) - full width */}
        <PatientRnaPanel
          data={patientRna}
          gene={g.symbol ?? geneId}
          compareData={comparisonReady ? comparePatientRna : undefined}
          compareGene={activeCompareGene}
          interpretation={primaryInterpretation('patientRna', patientObservations(patientRna), comparisonReady ? patientObservations(comparePatientRna || []) : undefined)}
        />

        {/* ── Functional annotation ────────────────────────────────────────── */}
        <div className="ibce-section-title" style={{ marginTop: 48 }}>
          <h2>{t('functionalAnnotation')} <InfoTooltip entryKey="mygene" /></h2>
          <span>MyGene.info - KEGG - GO</span>
        </div>

        {comparisonReady && cg
          ? <>
            <div className="ibce-annotation-compare">
              {[g, cg].map((gene, index) => (
                <div className="ibce-panel ibce-annotation-gene" key={gene.ensemblId ?? gene.symbol ?? index}>
                  <div className="ibce-eyebrow">{index === 0 ? 'Primary gene' : 'Comparison gene'}</div>
                  <h3 className="ibce-serif">{gene.symbol || gene.name}</h3>
                </div>
              ))}
              {(['function', 'kegg', 'reactome', 'biological', 'molecular', 'cellular'] as const).map(section =>
                [a ?? null, compareDossier.annotation ?? null].map((annotation, index) => (
                  <section className="ibce-panel ibce-annotation-cell" key={`${section}-${index}`}
                    aria-label={`${index === 0 ? g.symbol : cg.symbol} - ${section}`}>
                    <div className="ibce-eyebrow">{index === 0 ? g.symbol : cg.symbol}</div>
                    <h3>{section === 'function' ? t('function')
                      : section === 'kegg' ? `KEGG ${t('pathways')}`
                        : section === 'reactome' ? `Reactome ${t('pathways')}`
                          : section === 'biological' ? t('biologicalProcesses')
                            : section === 'molecular' ? t('molecularFunctions')
                              : t('cellularComponents')}
                      {section === 'function' && <> <InfoTooltip entryKey="mygene" /></>}
                    </h3>
                    <ComparisonAnnotationItem annotation={annotation} section={section} />
                  </section>
                )))}
            </div>
            <div className="ibce-panel" style={{ marginTop: 16 }}>
              <AiInterpretation
                panel="functional"
                locale={lang}
                primary={interpretationGene(g, [`Gene description: ${g.summary || 'not available'}`, ...annotationObservations(a ?? null)])}
                comparison={interpretationGene(cg, [`Gene description: ${cg.summary || 'not available'}`, ...annotationObservations(compareDossier.annotation ?? null)])}
                key={JSON.stringify({ panel: 'functional', locale: lang, primary: g.symbol, comparison: cg.symbol, a, compareAnnotation: compareDossier.annotation })}
              />
            </div>
          </>
          : a
          ? <div className="ibce-grid ibce-grid-2">
            <section className="ibce-panel">
              {!a && <p className="ibce-muted">{t('noAnnotation')}</p>}
              {a && <>
              {a.functionSummary && (
                <div className="ibce-annot-group">
                  <div className="ibce-annot-group-label">
                     <h3>{t('function')}</h3>
                    <InfoTooltip entryKey="mygene" />
                    <span className="ibce-source-badge" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
                      MyGene.info
                    </span>
                  </div>
                  <p className="ibce-muted" style={{ lineHeight: 1.65, fontSize: 14, margin: 0 }}>
                    {a.functionSummary}
                  </p>
                </div>
              )}
              {a.pathways && a.pathways.length > 0 && (
                <div style={{ marginTop: a.functionSummary ? 28 : 0 }}>
                  <PathwayGroup pathways={a.pathways} />
                </div>
              )}
              {!a.pathways?.length && !a.functionSummary && <p className="ibce-muted">{t('noAnnotation')}</p>}
              </>}
              <AiInterpretation
                panel="functional"
                locale={lang}
                primary={interpretationGene(g, [`Gene description: ${g.summary || 'not available'}`, ...annotationObservations(a ?? null)])}
                key={JSON.stringify({
                  panel: 'functional',
                  locale: lang,
                  primary: interpretationGene(g, [`Gene description: ${g.summary || 'not available'}`, ...annotationObservations(a ?? null)]),
                })}
              />
            </section>

            <section className="ibce-panel">
              {!a && <p className="ibce-muted">{t('noAnnotation')}</p>}
              {a && <>
              {a.biologicalProcesses && a.biologicalProcesses.length > 0 && (
                <AnnotGroup title={t('biologicalProcesses')} items={a.biologicalProcesses} source="GO:BP" />
              )}
              {a.molecularFunctions && a.molecularFunctions.length > 0 && (
                <AnnotGroup title={t('molecularFunctions')} items={a.molecularFunctions} source="GO:MF" />
              )}
              {a.cellularComponents && a.cellularComponents.length > 0 && (
                <AnnotGroup title={t('cellularComponents')} items={a.cellularComponents} source="GO:CC" />
              )}
              {(!a.biologicalProcesses?.length && !a.molecularFunctions?.length && !a.cellularComponents?.length) && (
                 <p className="ibce-muted ibce-small">{t('noGo')}</p>
              )}
              </>}
            </section>
          </div>
           : <div className="ibce-empty">{t('noAnnotation')}</div>}

      </div>
    </div>
  );
}
