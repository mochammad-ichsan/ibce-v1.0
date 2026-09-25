import { ArrowRight, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';
import {
  useIbceGetStatus,
  useIbceRunIngest,
} from '@workspace/api-client-react';
import { InfoTooltip } from './scientific-tooltip';
import { localizedDatasetLabel, useIbceLocale } from './locale';
import { IbceSectionNav } from './section-nav';
import './ibce.css';

function IngestButton({
  dataset = 'all',
  onComplete,
}: {
  dataset?: 'ihc' | 'prognosis' | 'cellline_meta' | 'cellline_rna' | 'patient_rna' | 'clinical' | 'all';
  onComplete?: () => void;
}) {
  const m = useIbceRunIngest();
  const { lang, t } = useIbceLocale();
  return (
    <div className="ibce-ingest-control">
      <span className="ibce-action-with-help">
        <button
          className="ibce-btn"
          disabled={m.isPending}
          onClick={() => m.mutate(
            { data: { dataset } },
            { onSuccess: () => onComplete?.() },
          )}
          data-testid={`button-ingest-${dataset}`}
          aria-label={dataset === 'all' ? t('ingestAvailable') : t('ingest', { dataset })}
        >
          {m.isPending
            ? <><RefreshCw size={13} aria-hidden="true" className="ibce-spin" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />{t('ingesting')}</>
            : <>{dataset === 'all' ? t('ingestAvailable') : t('ingest', { dataset })}</>}
        </button>
        <InfoTooltip entryKey="ingestion" />
      </span>
      {m.data && (
        <div className={`ibce-ingest-result ${m.data.ok ? 'success' : 'error'}`} role="status">
          {m.data.ok
            ? t('ingestionComplete', { count: m.data.rowsIngested.toLocaleString(), seconds: (m.data.durationMs / 1000).toFixed(1) })
            : t('ingestionFailed', { error: m.data.error || '' })}
        </div>
      )}
      {m.error && (
        <div className="ibce-ingest-result error" role="alert">
           {t('ingestionRequestFailed')}
        </div>
      )}
    </div>
  );
}

export default function IBCEAbout() {
  const [, setLoc] = useLocation();
  const { lang, t } = useIbceLocale();
  const { data: status, refetch: refetchStatus } = useIbceGetStatus();

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
          {' / '}{t('provenance')}
        </div>

        <div className="ibce-hero" style={{ paddingBottom: 20 }}>
          <h1>{t('dataSources')}</h1>
          <p>
            {t('sourceDescription')}
          </p>
        </div>
        <IbceSectionNav />

        <div className="ibce-section-title">
          <h2>{t('datasetRegistry')} <InfoTooltip entryKey="datasetStatus" /></h2>
          <span>{t('ingestionState')}</span>
        </div>
        <div className="ibce-panel">
          {status?.datasets?.map(d => (
            <div className="ibce-dataset" key={d.key}>
              <div>
                 <b>{localizedDatasetLabel(d.key, d.label, lang)}</b>
                 <div className="ibce-small ibce-muted">{t('source')}: {d.source}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <div className={`ibce-class ${d.isIngested ? 'ibce-favorable' : 'ibce-potential'}`} aria-label={`${t('datasetStatus')}: ${d.isIngested ? t('ingested') : t('notIngested')}`}>
                   {d.isIngested ? t('ingested') : t('notIngested')}
                </div>
                 <div className="ibce-small ibce-mono ibce-muted">{d.rowCount?.toLocaleString() || '-'} {t('rows')}</div>
              </div>
            </div>
          ))}
          <div className="ibce-ingest-note">
           {t('ingestionWarning')}
          </div>
          <div style={{ marginTop: 12 }}><IngestButton onComplete={() => { void refetchStatus(); }} /></div>
        </div>

        <aside className="ibce-citation-pointer">
          <div>
            <div className="ibce-eyebrow">{t('citationEyebrow')}</div>
            <h2>{t('bibliographyMovedTitle')}</h2>
            <p>{t('bibliographyMovedDescription')}</p>
          </div>
          <button className="ibce-card-action" onClick={() => setLoc('/ibce/citation')}>
            {t('openCitation')} <ArrowRight size={13} aria-hidden="true" />
          </button>
        </aside>

        <aside className="ibce-citation-pointer" style={{ marginTop: 24, background: 'transparent' }}>
          <div>
            <div className="ibce-eyebrow">{t('downloadCenterEyebrow')}</div>
            <h2>{t('downloadCenter')}</h2>
            <p>
              {lang === 'id'
                ? 'Dataset sumber yang didokumentasikan di atas dinormalisasi secara internal untuk mesin IBCE. Peneliti dapat mengunduh paket data yang telah dinormalisasi tersebut melalui Pusat Unduhan. Namun untuk riset klinis dan publikasi, Anda sangat disarankan merujuk pada berkas asli dari sumber hulu secara langsung.'
                : 'The source datasets documented above are normalized internally for the IBCE engine. Researchers can download these normalized data packages via the Download Center. However, for clinical research and publication, it is highly recommended to reference the original files from the upstream sources directly.'}
            </p>
          </div>
          <button className="ibce-card-action" onClick={() => setLoc('/ibce/download')}>
            {t('openDownloadCenter')} <ArrowRight size={13} aria-hidden="true" />
          </button>
        </aside>
      </div>
    </div>
  );
}
