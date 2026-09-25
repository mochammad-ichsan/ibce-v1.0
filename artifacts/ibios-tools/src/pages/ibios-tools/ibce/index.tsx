import { useState } from 'react';
import { BookOpen, Database, FileText, Search, Wrench, Download, Microscope, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  useIbceGetStatus,
  useIbceSearchGenes,
  getIbceSearchGenesQueryKey,
} from '@workspace/api-client-react';
import { InfoTooltip } from './scientific-tooltip';
import { localizedDatasetLabel, useIbceLocale } from './locale';
import './ibce.css';

function NavigateCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  href,
  tooltipKey,
  testId,
  onNavigate,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  href: string;
  tooltipKey: 'navDataSources' | 'navMethods' | 'navGlossary' | 'navCitation' | 'navDownloadCenter';
  testId: string;
  onNavigate: (href: string) => void;
}) {
  return (
    <article className="ibce-panel ibce-nav-card">
      <div className="ibce-nav-card-top">
        <div className="ibce-nav-card-icon"><Icon size={17} aria-hidden="true" /></div>
        <InfoTooltip entryKey={tooltipKey} />
      </div>
      <div className="ibce-eyebrow">{eyebrow}</div>
      <h2 className="ibce-serif">{title}</h2>
      <p className="ibce-muted ibce-small">{description}</p>
      <button className="ibce-card-action" onClick={() => onNavigate(href)} data-testid={testId}>
        {action}
      </button>
    </article>
  );
}

export default function IBCEDiscovery() {
  const [q, setQ] = useState('');
  const [, setLoc] = useLocation();
  const { lang, t } = useIbceLocale();
  const { data: status, isLoading: statusLoading } = useIbceGetStatus();
  const { data: results, isLoading } = useIbceSearchGenes(
    { q, limit: 8 },
    { query: { enabled: q.length >= 2, queryKey: getIbceSearchGenesQueryKey({ q, limit: 8 }) } }
  );
  const examples = ['BRCA1', 'ERBB2', 'ESR1', 'PIK3CA'];

  return (
    <div className="ibce-wrap">
      <div className="ibce-page">
        <section className="ibce-hero">
           <div className="ibce-eyebrow">IBCE - 01 / {t('discovery')}</div>
          <h1>{t('discovery')}</h1>
          <p>
             {t('discoveryIntro')}
            {' '}<InfoTooltip entryKey="geneSearch" />
          </p>
          <div style={{ position: 'relative' }}>
            <div className="ibce-searchbox">
              <Search size={19} aria-hidden="true" style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && q && setLoc(`/ibce/gene/${q}`)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchAria')}
                data-testid="input-gene-search"
              />
              <button
                onClick={() => q && setLoc(`/ibce/gene/${q}`)}
                data-testid="button-search"
                aria-label={t('openDossier')}
              >
                {t('open')}
              </button>
            </div>
            {q.length >= 2 && (
              <div className="ibce-suggestions">
                {isLoading
                  ? <div className="ibce-suggestion ibce-muted">{t('querying')}</div>
                  : results?.length
                    ? results.map((r, i) => (
                      <div
                        className="ibce-suggestion"
                        key={r.ensemblId || i}
                        onClick={() => { setQ(''); setLoc(`/ibce/gene/${r.symbol}`); }}
                        data-testid={`result-gene-${i}`}
                      >
                        <span><b>{r.symbol}</b> <span className="ibce-muted">{r.name}</span></span>
                        <span className="ibce-mono ibce-muted">{r.chromosome || '-'}</span>
                      </div>
                    ))
                    : <div className="ibce-suggestion ibce-muted">{t('noGenes')}</div>}
              </div>
            )}
          </div>
          <div className="ibce-small ibce-muted">
            {t('tryEntry')}{' '}
            {examples.map(x => (
              <button
                key={x}
                onClick={() => setLoc(`/ibce/gene/${x}`)}
                style={{ border: 0, background: 'none', color: 'hsl(var(--primary))', fontWeight: 700, cursor: 'pointer', marginRight: 12, font: 'inherit' }}
                data-testid={`button-example-${x}`}
                aria-label={`Open curated gene dossier for ${x}`}
              >
                {x}
              </button>
            ))}
            <InfoTooltip entryKey="geneSymbol" />
          </div>
        </section>

        <div className="ibce-section-title">
          <h2>{t('readiness')} <InfoTooltip entryKey="datasetStatus" /></h2>
          <span>{t('liveStatus')}</span>
        </div>

        <div className="ibce-grid ibce-grid-3">
          {statusLoading
            ? [1, 2, 3].map(x => (
              <div className="ibce-panel ibce-status-card" key={x}>
                <div className="ibce-metric" style={{ opacity: 0.3 }}>-</div>
                <div className="ibce-muted ibce-small">{t('loadingStatus')}</div>
              </div>
            ))
            : <>
              <div className="ibce-panel ibce-status-card">
                <div className="ibce-eyebrow">{t('indexedGenes')} <InfoTooltip entryKey="geneSearch" /></div>
                <div className="ibce-metric">{status?.geneCount?.toLocaleString() || '-'}</div>
                <div className="ibce-muted ibce-small">{t('searchableRecords')}</div>
              </div>
              <div className="ibce-panel ibce-status-card" style={{ gridColumn: 'span 2' }}>
                <div className="ibce-eyebrow" style={{ marginBottom: 12 }}>{t('datasetLayers')}</div>
                {status?.datasets?.map(d => (
                  <div className="ibce-status-line" key={d.key}>
                    <span className={`ibce-dot ${d.isIngested ? 'ok' : ''}`} aria-hidden="true" />
                     <span>{localizedDatasetLabel(d.key, d.label, lang)}</span>
                    <span className="ibce-mono" style={{ marginLeft: 'auto' }}>
                       {d.isIngested ? `${t('ready')} - ${d.rowCount?.toLocaleString() || '?'} ${t('rows')}` : t('pending')}
                    </span>
                  </div>
                ))}
              </div>
            </>}
        </div>

          <div className="ibce-section-title" style={{ marginTop: 48 }}>
            <h2>{t('navigate')}</h2>
            <span>{t('sections')}</span>
          </div>
          <div className="ibce-grid ibce-nav-grid">
            <NavigateCard
              icon={Microscope}
              eyebrow={t('cellLinesEyebrow')}
              title={t('cellLinesTitle')}
              description={t('cellLinesDescription')}
              action={t('openCellLines')}
              href="/ibce/cell-lines"
              tooltipKey="navDataSources"
              testId="button-open-cell-lines"
              onNavigate={setLoc}
            />
            <NavigateCard
              icon={Database}
              eyebrow={t('dataSourcesEyebrow')}
            title={t('dataSources')}
            description={t('sourceDescription')}
            action={t('openSources')}
            href="/ibce/about"
            tooltipKey="navDataSources"
            testId="button-open-data-sources"
            onNavigate={setLoc}
          />
          <NavigateCard
            icon={Wrench}
            eyebrow={t('methodsEyebrow')}
            title={t('methods')}
            description={t('methodsDescription')}
            action={t('openMethods')}
            href="/ibce/resources"
            tooltipKey="navMethods"
            testId="button-open-methods"
            onNavigate={setLoc}
          />
          <NavigateCard
            icon={BookOpen}
            eyebrow={t('glossaryEyebrow')}
            title={t('glossary')}
            description={t('glossaryDescription')}
            action={t('openGlossary')}
            href="/ibce/glossary"
            tooltipKey="navGlossary"
            testId="button-open-glossary"
            onNavigate={setLoc}
          />
          <NavigateCard
            icon={FileText}
            eyebrow={t('citationEyebrow')}
            title={t('citation')}
            description={t('citationDescription')}
            action={t('openCitation')}
            href="/ibce/citation"
            tooltipKey="navCitation"
            testId="button-open-citation"
            onNavigate={setLoc}
          />
          <NavigateCard
            icon={Download}
            eyebrow={t('downloadCenterEyebrow')}
            title={t('downloadCenter')}
            description={t('downloadCenterDescription')}
            action={t('openDownloadCenter')}
            href="/ibce/download"
            tooltipKey="navDownloadCenter"
            testId="button-open-download-center"
            onNavigate={setLoc}
          />
        </div>
          <section className="ibce-panel" style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="ibce-nav-card-icon"><ShieldCheck size={17} aria-hidden="true" /></div>
              <div>
                <div className="ibce-eyebrow">MAINTENANCE ACCESS</div>
                <h2 className="ibce-serif">IBCE Admin Dashboard</h2>
                <p className="ibce-muted ibce-small">Review dataset health and perform protected maintenance actions.</p>
              </div>
            </div>
            <button className="ibce-card-action" onClick={() => setLoc('/ibce/admin')} data-testid="link-ibce-admin">
              Open Admin Dashboard
            </button>
          </section>
      </div>
    </div>
  );
}

